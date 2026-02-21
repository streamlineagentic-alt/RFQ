import { Request, Response } from 'express';
import prisma from '../config/database';
import multer from 'multer';
import * as XLSX from 'xlsx';

export const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['text/csv', 'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'];
    cb(null, allowed.includes(file.mimetype) || file.originalname.endsWith('.csv'));
  }
});

/**
 * GET /api/v1/inventory
 * List inventory items with filters: sector, productFamily, supplierId, keyword, h2s, nace
 */
export const getInventory = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }

    const {
      sector,
      productFamily,
      vendorId,
      keyword,
      h2s,
      nace,
      condition,
      page = '1',
      limit = '50',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Build OilGasProductSpec filter
    const specWhere: any = {};
    if (sector) specWhere.sector = sector;
    if (productFamily) specWhere.productFamily = { contains: productFamily, mode: 'insensitive' };
    if (h2s === 'true') specWhere.isH2sService = true;
    if (nace === 'true') specWhere.naceCompliant = true;

    // Build InventoryItem filter
    const itemWhere: any = { isExpired: false };
    if (vendorId) itemWhere.vendorId = parseInt(vendorId);
    if (condition) itemWhere.condition = condition;
    if (keyword) {
      itemWhere.OR = [
        { description: { contains: keyword, mode: 'insensitive' } },
        { mpn: { contains: keyword, mode: 'insensitive' } },
        { vendorSku: { contains: keyword, mode: 'insensitive' } },
        { oem: { contains: keyword, mode: 'insensitive' } },
        { model: { contains: keyword, mode: 'insensitive' } },
        { oilGasSpec: { productFamily: { contains: keyword, mode: 'insensitive' } } },
        { oilGasSpec: { apiStandard: { contains: keyword, mode: 'insensitive' } } },
        { oilGasSpec: { materialGrade: { contains: keyword, mode: 'insensitive' } } },
        { oilGasSpec: { manufacturerName: { contains: keyword, mode: 'insensitive' } } },
      ];
    }

    // If any spec filters exist, only return items that HAVE a spec matching them
    if (Object.keys(specWhere).length > 0) {
      itemWhere.oilGasSpec = { is: specWhere };
    }

    const [total, items] = await Promise.all([
      prisma.inventoryItem.count({ where: itemWhere }),
      prisma.inventoryItem.findMany({
        where: itemWhere,
        include: {
          vendor: {
            select: { id: true, name: true, vendorCode: true, contactEmail: true }
          },
          category: {
            select: { id: true, name: true, slug: true }
          },
          oilGasSpec: true,
        },
        orderBy: [
          { status: 'asc' },
          { qtyAvailable: 'desc' },
        ],
        skip,
        take: limitNum,
      }),
    ]);

    res.status(200).json({
      data: items,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch inventory' } });
  }
};

/**
 * GET /api/v1/inventory/:id
 */
export const getInventoryItem = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }

    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      res.status(400).json({ error: { code: 'INVALID_ID', message: 'Invalid inventory item ID' } });
      return;
    }

    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        vendor: true,
        category: true,
        oilGasSpec: true,
      },
    });

    if (!item) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Inventory item not found' } });
      return;
    }

    res.status(200).json({ data: item });
  } catch (error) {
    console.error('Get inventory item error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch inventory item' } });
  }
};

/**
 * GET /api/v1/inventory/sectors
 * Returns distinct sector + productFamily values for filter dropdowns
 */
export const getInventoryFilters = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }

    const [sectors, families, vendors] = await Promise.all([
      prisma.oilGasProductSpec.findMany({
        select: { sector: true },
        distinct: ['sector'],
        orderBy: { sector: 'asc' },
      }),
      prisma.oilGasProductSpec.findMany({
        select: { productFamily: true },
        distinct: ['productFamily'],
        where: { productFamily: { not: null } },
        orderBy: { productFamily: 'asc' },
      }),
      prisma.vendor.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    res.status(200).json({
      data: {
        sectors: sectors.map(s => s.sector),
        productFamilies: families.map(f => f.productFamily).filter(Boolean),
        vendors,
      },
    });
  } catch (error) {
    console.error('Get inventory filters error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch filters' } });
  }
};

/**
 * Import inventory items from CSV/XLSX
 * POST /api/v1/inventory/import
 * Required columns: sku, description, qty, shipFromCountry, earliestShipDate
 * Optional: price, currency, condition, sector, oem, mpn, model
 */
export const importInventory = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }

    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) {
      res.status(400).json({ error: { code: 'NO_FILE', message: 'No file uploaded. Accepted: .csv, .xlsx' } });
      return;
    }

    // Parse file with XLSX (handles both CSV and Excel)
    const workbook = XLSX.read(file.buffer, { type: 'buffer', cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (rows.length === 0) {
      res.status(400).json({ error: { code: 'EMPTY_FILE', message: 'File contains no data rows' } });
      return;
    }

    // Upsert a default "CSV Import" vendor
    const vendor = await prisma.vendor.upsert({
      where: { vendorCode: 'CSV_IMPORT' },
      update: {},
      create: { name: 'CSV Import', vendorCode: 'CSV_IMPORT', feedType: 'manual' }
    });

    const now = new Date();
    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // 1-indexed + header row

      const sku = String(row.sku || row.SKU || row['Vendor SKU'] || '').trim();
      const description = String(row.description || row.Description || '').trim();
      const qty = parseFloat(row.qty || row.Qty || row.quantity || row.Quantity || '0');
      const shipFromCountry = String(row.shipFromCountry || row['Ship From Country'] || row.country || '').trim();
      let earliestShipDate: Date;

      try {
        const rawDate = row.earliestShipDate || row['Earliest Ship Date'] || row.shipDate || row['Ship Date'];
        earliestShipDate = rawDate instanceof Date ? rawDate : new Date(rawDate || now);
        if (isNaN(earliestShipDate.getTime())) earliestShipDate = now;
      } catch {
        earliestShipDate = now;
      }

      if (!sku) { errors.push(`Row ${rowNum}: missing sku`); skipped++; continue; }
      if (!description) { errors.push(`Row ${rowNum}: missing description`); skipped++; continue; }

      const price = parseFloat(row.price || row.Price || '0') || null;
      const currency = String(row.currency || row.Currency || 'USD').trim();
      const condition = String(row.condition || row.Condition || 'new').toLowerCase();
      const sector = String(row.sector || row.Sector || 'midstream').trim();
      const oem = String(row.oem || row.OEM || '').trim() || null;
      const mpn = String(row.mpn || row.MPN || '').trim() || null;

      try {
        await prisma.inventoryItem.upsert({
          where: { vendorId_vendorSku: { vendorId: vendor.id, vendorSku: sku } },
          update: {
            description, qtyAvailable: qty, shipFromCountry: shipFromCountry || null,
            earliestShipDate, price: price as any, currency: currency || null,
            condition, lastVerified: now, verificationMethod: 'manual'
          },
          create: {
            vendorId: vendor.id, vendorSku: sku, description, qtyAvailable: qty,
            shipFromCountry: shipFromCountry || null, earliestShipDate,
            price: price as any, currency: currency || null,
            condition, oem, mpn,
            lastVerified: now, verificationMethod: 'manual', status: 'available',
            oilGasSpec: sector ? { create: { sector } } : undefined
          }
        });
        created++;
      } catch (err) {
        errors.push(`Row ${rowNum} (${sku}): ${(err as Error).message}`);
        skipped++;
      }
    }

    res.status(200).json({
      message: `Import complete: ${created} upserted, ${skipped} skipped`,
      data: { created, skipped, total: rows.length, errors: errors.slice(0, 20) }
    });
  } catch (error) {
    console.error('Import inventory error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to import inventory' } });
  }
};

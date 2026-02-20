import { Request, Response } from 'express';
import prisma from '../config/database';

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

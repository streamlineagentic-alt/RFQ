import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../config/database';

export const getMySupplierProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }); return; }
    const supplier = await prisma.supplier.findUnique({
      where: { userId: req.user.id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        categories: { include: { category: true } },
        _count: { select: { rfqSuppliers: true, quotes: true } }
      }
    });
    if (!supplier) { res.status(404).json({ error: { code: 'SUPPLIER_NOT_FOUND', message: 'Supplier profile not found' } }); return; }
    res.status(200).json({ data: supplier });
  } catch (error) {
    console.error('Get my supplier profile error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch supplier profile' } });
  }
};

export const updateMySupplierProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }); return; }
    const existing = await prisma.supplier.findUnique({ where: { userId: req.user.id } });
    if (!existing) { res.status(404).json({ error: { code: 'SUPPLIER_NOT_FOUND', message: 'Supplier profile not found' } }); return; }
    const { companyName, supplierType, description, website, contactName, contactEmail, contactPhone, country, city, address, regionsServed, canExportToUkraine, certifications } = req.body;
    const supplier = await prisma.supplier.update({
      where: { userId: req.user.id },
      data: {
        ...(companyName && { companyName }),
        ...(supplierType !== undefined && { supplierType }),
        ...(description !== undefined && { description }),
        ...(website !== undefined && { website }),
        ...(contactName !== undefined && { contactName }),
        ...(contactEmail !== undefined && { contactEmail }),
        ...(contactPhone !== undefined && { contactPhone }),
        ...(country !== undefined && { country }),
        ...(city !== undefined && { city }),
        ...(address !== undefined && { address }),
        ...(regionsServed !== undefined && { regionsServed }),
        ...(canExportToUkraine !== undefined && { canExportToUkraine }),
        ...(certifications !== undefined && { certifications }),
      },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true } }, categories: { include: { category: true } } }
    });
    res.status(200).json({ message: 'Supplier profile updated successfully', data: supplier });
  } catch (error) {
    console.error('Update my supplier profile error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to update supplier profile' } });
  }
};

/**
 * Create new supplier
 * POST /api/v1/suppliers
 */
export const createSupplier = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: errors.array() }
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }

    const {
      userId, companyName, supplierType, description, website,
      contactName, contactEmail, contactPhone,
      country, city, address,
      regionsServed, canExportToUkraine, certifications,
      categories
    } = req.body;

    const supplier = await prisma.supplier.create({
      data: {
        userId: userId || req.user.id,
        companyName,
        supplierType,
        description,
        website,
        contactName,
        contactEmail,
        contactPhone,
        country,
        city,
        address,
        regionsServed: regionsServed || [],
        canExportToUkraine: canExportToUkraine || false,
        certifications: certifications || [],
        ...(categories && {
          categories: {
            create: categories.map((catId: number) => ({ categoryId: catId }))
          }
        })
      },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        categories: { include: { category: true } }
      }
    });

    res.status(201).json({ message: 'Supplier created successfully', data: supplier });
  } catch (error) {
    console.error('Create supplier error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to create supplier' } });
  }
};

/**
 * Get all suppliers (with filters and pagination)
 * GET /api/v1/suppliers
 */
export const getSuppliers = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }

    const {
      country,
      categoryId,
      supplierType,
      isActive,
      page = '1',
      limit = '20'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (country) where.country = country;
    if (supplierType) where.supplierType = supplierType;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (categoryId) {
      where.categories = {
        some: { categoryId: parseInt(categoryId as string) }
      };
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          categories: { include: { category: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.supplier.count({ where })
    ]);

    res.status(200).json({
      data: suppliers,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch suppliers' } });
  }
};

/**
 * Get supplier by ID
 * GET /api/v1/suppliers/:id
 */
export const getSupplierById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }

    const supplierId = parseInt(req.params.id as string);
    if (isNaN(supplierId)) {
      res.status(400).json({ error: { code: 'INVALID_ID', message: 'Invalid supplier ID' } });
      return;
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        categories: { include: { category: true } },
        _count: { select: { rfqSuppliers: true, quotes: true } }
      }
    });

    if (!supplier) {
      res.status(404).json({ error: { code: 'SUPPLIER_NOT_FOUND', message: 'Supplier not found' } });
      return;
    }

    res.status(200).json({ data: supplier });
  } catch (error) {
    console.error('Get supplier error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch supplier' } });
  }
};

/**
 * Update supplier
 * PATCH /api/v1/suppliers/:id
 */
export const updateSupplier = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: errors.array() }
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }

    const supplierId = parseInt(req.params.id as string);
    if (isNaN(supplierId)) {
      res.status(400).json({ error: { code: 'INVALID_ID', message: 'Invalid supplier ID' } });
      return;
    }

    const existing = await prisma.supplier.findUnique({ where: { id: supplierId } });
    if (!existing) {
      res.status(404).json({ error: { code: 'SUPPLIER_NOT_FOUND', message: 'Supplier not found' } });
      return;
    }

    const {
      companyName, supplierType, description, website,
      contactName, contactEmail, contactPhone,
      country, city, address,
      regionsServed, canExportToUkraine, certifications, isActive
    } = req.body;

    const supplier = await prisma.supplier.update({
      where: { id: supplierId },
      data: {
        ...(companyName && { companyName }),
        ...(supplierType !== undefined && { supplierType }),
        ...(description !== undefined && { description }),
        ...(website !== undefined && { website }),
        ...(contactName !== undefined && { contactName }),
        ...(contactEmail !== undefined && { contactEmail }),
        ...(contactPhone !== undefined && { contactPhone }),
        ...(country !== undefined && { country }),
        ...(city !== undefined && { city }),
        ...(address !== undefined && { address }),
        ...(regionsServed !== undefined && { regionsServed }),
        ...(canExportToUkraine !== undefined && { canExportToUkraine }),
        ...(certifications !== undefined && { certifications }),
        ...(isActive !== undefined && { isActive })
      },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        categories: { include: { category: true } }
      }
    });

    res.status(200).json({ message: 'Supplier updated successfully', data: supplier });
  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to update supplier' } });
  }
};

/**
 * Soft-delete supplier (set isActive = false)
 * DELETE /api/v1/suppliers/:id
 */
export const deleteSupplier = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }

    const supplierId = parseInt(req.params.id as string);
    if (isNaN(supplierId)) {
      res.status(400).json({ error: { code: 'INVALID_ID', message: 'Invalid supplier ID' } });
      return;
    }

    const existing = await prisma.supplier.findUnique({ where: { id: supplierId } });
    if (!existing) {
      res.status(404).json({ error: { code: 'SUPPLIER_NOT_FOUND', message: 'Supplier not found' } });
      return;
    }

    await prisma.supplier.update({
      where: { id: supplierId },
      data: { isActive: false }
    });

    res.status(200).json({ message: 'Supplier deactivated successfully' });
  } catch (error) {
    console.error('Delete supplier error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to delete supplier' } });
  }
};

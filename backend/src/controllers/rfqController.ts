import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../config/database';
import { generateRfqNumber } from '../utils/rfqNumberGenerator';
import { normalizationService } from '../services/normalizationService';
import { supplierMatchingService } from '../services/supplierMatchingService';

/**
 * Create new RFQ
 * POST /api/v1/rfqs
 */
export const createRfq = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: errors.array()
        }
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
      return;
    }

    const {
      projectName,
      categoryId,
      industry,
      deliveryCountry,
      deliveryCity,
      deliveryAddress,
      deliveryWindowStart,
      deliveryWindowEnd,
      description,
      specifications,
      quantity,
      quantityUom,
      responseDeadline,
      metadata
    } = req.body;

    // Generate unique RFQ number
    let rfqNumber = generateRfqNumber();

    // Ensure uniqueness
    let exists = await prisma.rfq.findUnique({ where: { rfqNumber } });
    while (exists) {
      rfqNumber = generateRfqNumber();
      exists = await prisma.rfq.findUnique({ where: { rfqNumber } });
    }

    // Create RFQ
    const rfq = await prisma.rfq.create({
      data: {
        buyerId: req.user.id,
        rfqNumber,
        projectName,
        status: 'draft',
        categoryId: categoryId ? parseInt(categoryId) : null,
        industry,
        deliveryCountry,
        deliveryCity,
        deliveryAddress,
        deliveryWindowStart: deliveryWindowStart ? new Date(deliveryWindowStart) : null,
        deliveryWindowEnd: deliveryWindowEnd ? new Date(deliveryWindowEnd) : null,
        description,
        specifications,
        quantity: quantity ? parseFloat(quantity) : null,
        quantityUom,
        responseDeadline: responseDeadline ? new Date(responseDeadline) : null,
        metadata: metadata || {}
      },
      include: {
        category: true,
        buyer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            companyName: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'RFQ created successfully',
      data: rfq
    });
  } catch (error) {
    console.error('Create RFQ error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to create RFQ'
      }
    });
  }
};

/**
 * Get all RFQs (with filters)
 * GET /api/v1/rfqs
 */
export const getRfqs = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
      return;
    }

    const {
      status,
      categoryId,
      deliveryCountry,
      page = '1',
      limit = '20'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const where: any = {};

    // Buyers see only their RFQs
    if (req.user.role === 'buyer') {
      where.buyerId = req.user.id;
    }

    if (status) {
      where.status = status;
    }

    if (categoryId) {
      where.categoryId = parseInt(categoryId as string);
    }

    if (deliveryCountry) {
      where.deliveryCountry = deliveryCountry;
    }

    // Get RFQs with pagination
    const [rfqs, total] = await Promise.all([
      prisma.rfq.findMany({
        where,
        include: {
          category: true,
          buyer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              companyName: true
            }
          },
          _count: {
            select: {
              rfqSuppliers: true,
              quotes: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limitNum
      }),
      prisma.rfq.count({ where })
    ]);

    res.status(200).json({
      data: rfqs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get RFQs error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch RFQs'
      }
    });
  }
};

/**
 * Get single RFQ by ID
 * GET /api/v1/rfqs/:id
 */
export const getRfqById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
      return;
    }

    const rfqId = parseInt(req.params.id as string);

    if (isNaN(rfqId)) {
      res.status(400).json({
        error: {
          code: 'INVALID_ID',
          message: 'Invalid RFQ ID'
        }
      });
      return;
    }

    const rfq = await prisma.rfq.findUnique({
      where: { id: rfqId },
      include: {
        category: true,
        buyer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            companyName: true
          }
        },
        rfqSuppliers: {
          include: {
            supplier: {
              select: {
                id: true,
                companyName: true,
                supplierType: true,
                country: true
              }
            }
          }
        },
        quotes: {
          include: {
            supplier: {
              select: {
                id: true,
                companyName: true
              }
            }
          }
        }
      }
    });

    if (!rfq) {
      res.status(404).json({
        error: {
          code: 'RFQ_NOT_FOUND',
          message: 'RFQ not found'
        }
      });
      return;
    }

    // Check permissions
    if (req.user.role === 'buyer' && rfq.buyerId !== req.user.id) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this RFQ'
        }
      });
      return;
    }

    res.status(200).json({
      data: rfq
    });
  } catch (error) {
    console.error('Get RFQ by ID error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch RFQ'
      }
    });
  }
};

/**
 * Update RFQ
 * PATCH /api/v1/rfqs/:id
 */
export const updateRfq = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: errors.array()
        }
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
      return;
    }

    const rfqId = parseInt(req.params.id as string);

    if (isNaN(rfqId)) {
      res.status(400).json({
        error: {
          code: 'INVALID_ID',
          message: 'Invalid RFQ ID'
        }
      });
      return;
    }

    // Check if RFQ exists and user has permission
    const existingRfq = await prisma.rfq.findUnique({
      where: { id: rfqId }
    });

    if (!existingRfq) {
      res.status(404).json({
        error: {
          code: 'RFQ_NOT_FOUND',
          message: 'RFQ not found'
        }
      });
      return;
    }

    if (req.user.role === 'buyer' && existingRfq.buyerId !== req.user.id) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this RFQ'
        }
      });
      return;
    }

    const {
      projectName,
      status,
      categoryId,
      industry,
      deliveryCountry,
      deliveryCity,
      deliveryAddress,
      deliveryWindowStart,
      deliveryWindowEnd,
      description,
      specifications,
      quantity,
      quantityUom,
      responseDeadline,
      buyerNotes,
      metadata
    } = req.body;

    // Update RFQ
    const updatedRfq = await prisma.rfq.update({
      where: { id: rfqId },
      data: {
        ...(projectName && { projectName }),
        ...(status && { status }),
        ...(categoryId !== undefined && { categoryId: categoryId ? parseInt(categoryId) : null }),
        ...(industry !== undefined && { industry }),
        ...(deliveryCountry && { deliveryCountry }),
        ...(deliveryCity !== undefined && { deliveryCity }),
        ...(deliveryAddress !== undefined && { deliveryAddress }),
        ...(deliveryWindowStart && { deliveryWindowStart: new Date(deliveryWindowStart) }),
        ...(deliveryWindowEnd && { deliveryWindowEnd: new Date(deliveryWindowEnd) }),
        ...(description && { description }),
        ...(specifications !== undefined && { specifications }),
        ...(quantity !== undefined && { quantity: quantity ? parseFloat(quantity) : null }),
        ...(quantityUom !== undefined && { quantityUom }),
        ...(responseDeadline && { responseDeadline: new Date(responseDeadline) }),
        ...(buyerNotes !== undefined && { buyerNotes }),
        ...(metadata && { metadata })
      },
      include: {
        category: true,
        buyer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            companyName: true
          }
        }
      }
    });

    res.status(200).json({
      message: 'RFQ updated successfully',
      data: updatedRfq
    });
  } catch (error) {
    console.error('Update RFQ error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to update RFQ'
      }
    });
  }
};

/**
 * Publish RFQ (change status from draft to open)
 * POST /api/v1/rfqs/:id/publish
 */
export const publishRfq = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
      return;
    }

    const rfqId = parseInt(req.params.id as string);

    if (isNaN(rfqId)) {
      res.status(400).json({
        error: {
          code: 'INVALID_ID',
          message: 'Invalid RFQ ID'
        }
      });
      return;
    }

    const rfq = await prisma.rfq.findUnique({
      where: { id: rfqId }
    });

    if (!rfq) {
      res.status(404).json({
        error: {
          code: 'RFQ_NOT_FOUND',
          message: 'RFQ not found'
        }
      });
      return;
    }

    if (req.user.role === 'buyer' && rfq.buyerId !== req.user.id) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to publish this RFQ'
        }
      });
      return;
    }

    if (rfq.status !== 'draft') {
      res.status(400).json({
        error: {
          code: 'INVALID_STATUS',
          message: 'Only draft RFQs can be published'
        }
      });
      return;
    }

    const publishedRfq = await prisma.rfq.update({
      where: { id: rfqId },
      data: {
        status: 'open',
        publishedAt: new Date()
      },
      include: {
        category: true
      }
    });

    res.status(200).json({
      message: 'RFQ published successfully',
      data: publishedRfq
    });
  } catch (error) {
    console.error('Publish RFQ error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to publish RFQ'
      }
    });
  }
};

/**
 * Normalize RFQ data
 * POST /api/v1/rfqs/:id/normalize
 */
export const normalizeRfq = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }

    const rfqId = parseInt(req.params.id as string);
    if (isNaN(rfqId)) {
      res.status(400).json({ error: { code: 'INVALID_ID', message: 'Invalid RFQ ID' } });
      return;
    }

    const rfq = await prisma.rfq.findUnique({ where: { id: rfqId } });
    if (!rfq) {
      res.status(404).json({ error: { code: 'RFQ_NOT_FOUND', message: 'RFQ not found' } });
      return;
    }

    if (req.user.role === 'buyer' && rfq.buyerId !== req.user.id) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied' } });
      return;
    }

    const result = await normalizationService.processNormalization(rfq);

    const updatedRfq = await prisma.rfq.update({
      where: { id: rfqId },
      data: {
        isNormalized: result.isNormalized,
        normalizedData: result.normalizedData as any,
        normalizationFlags: result.validationFlags as any
      }
    });

    res.status(200).json({
      message: 'RFQ normalized successfully',
      data: {
        rfq: updatedRfq,
        normalization: {
          isNormalized: result.isNormalized,
          qualityScore: result.qualityScore,
          validationFlags: result.validationFlags,
          normalizedData: result.normalizedData
        }
      }
    });
  } catch (error) {
    console.error('Normalize RFQ error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to normalize RFQ' } });
  }
};

/**
 * Get matching suppliers for an RFQ
 * GET /api/v1/rfqs/:id/matching-suppliers
 */
export const getMatchingSuppliers = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }

    const rfqId = parseInt(req.params.id as string);
    if (isNaN(rfqId)) {
      res.status(400).json({ error: { code: 'INVALID_ID', message: 'Invalid RFQ ID' } });
      return;
    }

    const rfq = await prisma.rfq.findUnique({ where: { id: rfqId } });
    if (!rfq) {
      res.status(404).json({ error: { code: 'RFQ_NOT_FOUND', message: 'RFQ not found' } });
      return;
    }

    if (req.user.role === 'buyer' && rfq.buyerId !== req.user.id) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied' } });
      return;
    }

    const allSuppliers = await prisma.supplier.findMany({
      where: { isActive: true },
      include: { categories: { include: { category: true } } }
    });

    const matches = supplierMatchingService.matchSuppliers(rfq, allSuppliers);
    const matchesWithTiers = matches.map(match => ({
      ...match,
      tier: supplierMatchingService.getMatchTier(match.score)
    }));

    res.status(200).json({
      data: {
        rfqId,
        rfqNumber: rfq.rfqNumber,
        matchCount: matchesWithTiers.length,
        matches: matchesWithTiers
      }
    });
  } catch (error) {
    console.error('Get matching suppliers error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to find matching suppliers' } });
  }
};

import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../config/database';
import { generateRfqNumber } from '../utils/rfqNumberGenerator';
import { normalizationService } from '../services/normalizationService';
import { supplierMatchingService } from '../services/supplierMatchingService';
import multer from 'multer';

export const rfqFileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    cb(null, allowed.includes(file.mimetype));
  }
});

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
      search,
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

    if (search) {
      where.OR = [
        { projectName: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { rfqNumber: { contains: search as string, mode: 'insensitive' } },
      ];
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
 * Get quote comparison data for an RFQ
 * GET /api/v1/rfqs/:id/comparison
 */
export const getQuoteComparison = async (req: Request, res: Response): Promise<void> => {
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

    const quotes = await prisma.quote.findMany({
      where: { rfqId, status: { not: 'withdrawn' } },
      include: {
        supplier: {
          select: {
            id: true,
            companyName: true,
            country: true,
            supplierType: true,
            responsivenessScore: true,
            certifications: true
          }
        }
      },
      orderBy: { price: 'asc' }
    });

    if (quotes.length === 0) {
      res.status(200).json({ data: { rfqId, rfqNumber: rfq.rfqNumber, quotes: [], recommendations: [], savedRecommendation: null } });
      return;
    }

    const activeQuotes = quotes.filter(q => q.status !== 'rejected');
    const prices = activeQuotes.map(q => Number(q.price));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const leadTimes = activeQuotes.filter(q => q.leadTimeWeeks != null).map(q => q.leadTimeWeeks as number);
    const minLeadTime = leadTimes.length > 0 ? Math.min(...leadTimes) : null;
    const maxLeadTime = leadTimes.length > 0 ? Math.max(...leadTimes) : null;
    const now = new Date();
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const enriched = quotes.map(quote => {
      const price = Number(quote.price);
      const isActive = quote.status !== 'rejected';

      const riskFlags: string[] = [];
      if (!quote.warrantyDescription) riskFlags.push('No warranty specified');
      if (!quote.paymentTerms) riskFlags.push('No payment terms');
      if (!quote.incoterm) riskFlags.push('No incoterms');
      if (quote.validUntil && new Date(quote.validUntil) < twoWeeksFromNow) riskFlags.push('Quote expires soon');
      if (!quote.leadTimeWeeks) riskFlags.push('No lead time specified');

      // Price score: 1.0 = cheapest, 0.0 = most expensive
      const priceScore = maxPrice > minPrice ? (maxPrice - price) / (maxPrice - minPrice) : 1;

      // Lead time score: 1.0 = fastest, 0.0 = slowest
      let leadTimeScore = 0.5;
      if (quote.leadTimeWeeks != null) {
        if (maxLeadTime !== null && minLeadTime !== null && maxLeadTime !== minLeadTime) {
          leadTimeScore = (maxLeadTime - quote.leadTimeWeeks) / (maxLeadTime - minLeadTime);
        } else {
          leadTimeScore = 1;
        }
      }

      const responsivenessScore = (quote.supplier.responsivenessScore || 3) / 5;
      const compositeScore = Math.round((priceScore * 0.4 + leadTimeScore * 0.4 + responsivenessScore * 0.2) * 100);

      return {
        id: quote.id,
        rfqId: quote.rfqId,
        supplierId: quote.supplierId,
        price,
        currency: quote.currency,
        leadTimeWeeks: quote.leadTimeWeeks,
        incoterm: quote.incoterm,
        paymentTerms: quote.paymentTerms,
        warrantyDescription: quote.warrantyDescription,
        validUntil: quote.validUntil,
        notes: quote.notes,
        status: quote.status,
        submittedAt: quote.submittedAt,
        supplier: quote.supplier,
        isBestPrice: isActive && price === minPrice,
        isFastestDelivery: isActive && quote.leadTimeWeeks === minLeadTime && minLeadTime !== null,
        riskFlags,
        compositeScore,
        priceScore: Math.round(priceScore * 100),
        leadTimeScore: Math.round(leadTimeScore * 100),
        isBalanced: false
      };
    });

    // Mark balanced winner
    const maxComposite = Math.max(...enriched.filter(q => q.status !== 'rejected').map(q => q.compositeScore));
    enriched.forEach(q => {
      q.isBalanced = q.status !== 'rejected' && q.compositeScore === maxComposite;
    });

    // Generate recommendations (top 3 active quotes by composite score)
    const sortedActive = [...enriched]
      .filter(q => q.status !== 'rejected')
      .sort((a, b) => b.compositeScore - a.compositeScore);

    const recommendations = sortedActive.slice(0, 3).map((q, i) => {
      const reasons: string[] = [];
      if (q.isBestPrice) reasons.push('Lowest price');
      if (q.isFastestDelivery) reasons.push('Fastest delivery');
      if (q.isBalanced) reasons.push('Best overall balance of price & speed');
      if ((q.supplier.responsivenessScore || 0) >= 4) reasons.push('Highly responsive supplier');
      if (q.riskFlags.length === 0) reasons.push('Complete quote — no missing fields');
      if (reasons.length === 0) reasons.push(`Ranked #${i + 1} by composite score`);
      return {
        rank: i + 1,
        quoteId: q.id,
        supplierId: q.supplierId,
        supplierName: q.supplier.companyName,
        country: q.supplier.country,
        price: q.price,
        currency: q.currency,
        leadTimeWeeks: q.leadTimeWeeks,
        compositeScore: q.compositeScore,
        reasons,
        riskCount: q.riskFlags.length
      };
    });

    const savedRecommendation = await prisma.recommendation.findFirst({
      where: { rfqId },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      data: { rfqId, rfqNumber: rfq.rfqNumber, quotes: enriched, recommendations, savedRecommendation }
    });
  } catch (error) {
    console.error('Get quote comparison error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to get quote comparison' } });
  }
};

/**
 * Save procurement recommendation
 * POST /api/v1/rfqs/:id/recommendation
 */
export const saveRecommendation = async (req: Request, res: Response): Promise<void> => {
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

    const { recommendedQuotes, buyerNotes } = req.body;

    const existing = await prisma.recommendation.findFirst({ where: { rfqId }, orderBy: { createdAt: 'desc' } });

    let recommendation;
    if (existing) {
      recommendation = await prisma.recommendation.update({
        where: { id: existing.id },
        data: {
          recommendedQuotes: recommendedQuotes || existing.recommendedQuotes,
          buyerNotes: buyerNotes !== undefined ? buyerNotes : existing.buyerNotes,
          isReviewed: true,
          reviewedAt: new Date()
        }
      });
    } else {
      recommendation = await prisma.recommendation.create({
        data: {
          rfqId,
          recommendedQuotes: recommendedQuotes || [],
          buyerNotes: buyerNotes || null,
          isReviewed: true,
          reviewedAt: new Date()
        }
      });
    }

    res.status(200).json({ message: 'Recommendation saved', data: recommendation });
  } catch (error) {
    console.error('Save recommendation error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to save recommendation' } });
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

/**
 * Upload a file attachment to an RFQ
 * POST /api/v1/rfqs/:id/upload
 */
export const uploadRfqFile = async (req: Request, res: Response): Promise<void> => {
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

    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) {
      res.status(400).json({ error: { code: 'NO_FILE', message: 'No file uploaded or file type not allowed (PDF, Excel, Word, CSV only, max 5 MB)' } });
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

    // Store file as base64 data URL in the originalFilePath column
    const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    await prisma.rfq.update({
      where: { id: rfqId },
      data: {
        originalFilePath: dataUrl,
        originalFileName: file.originalname,
        originalFileType: file.mimetype
      }
    });

    res.status(200).json({
      message: 'File uploaded successfully',
      data: { fileName: file.originalname, fileType: file.mimetype, size: file.size }
    });
  } catch (error) {
    console.error('Upload RFQ file error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to upload file' } });
  }
};

import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { generateRfqNumber } from '../utils/rfqNumberGenerator';
import { normalizationService } from '../services/normalizationService';
import { supplierMatchingService } from '../services/supplierMatchingService';
import { getMockSuppliers } from './supplierController.mock';

// Mock RFQ database (in-memory)
const mockRfqs: any[] = [
  {
    id: 1,
    buyerId: 1,
    rfqNumber: 'RFQ-20260215-0001',
    projectName: 'Industrial Equipment Procurement',
    status: 'open',
    categoryId: 1,
    industry: 'Manufacturing',
    deliveryCountry: 'USA',
    deliveryCity: 'New York',
    deliveryAddress: '123 Main St',
    deliveryWindowStart: new Date('2026-03-01'),
    deliveryWindowEnd: new Date('2026-03-15'),
    description: 'Need industrial machinery for manufacturing plant',
    specifications: 'Heavy-duty equipment, ISO certified',
    quantity: 5,
    quantityUom: 'units',
    metadata: {},
    normalizedData: null,
    isNormalized: false,
    normalizationFlags: null,
    createdAt: new Date('2026-02-01'),
    updatedAt: new Date('2026-02-01'),
    publishedAt: new Date('2026-02-01'),
    closedAt: null,
    responseDeadline: new Date('2026-02-28'),
    buyerNotes: 'Urgent request',
    buyer: {
      id: 1,
      email: 'admin@test.com',
      firstName: 'Admin',
      lastName: 'User',
      companyName: 'Admin Corp'
    },
    category: {
      id: 1,
      name: 'Industrial Equipment',
      slug: 'industrial-equipment'
    },
    _count: {
      rfqSuppliers: 3,
      quotes: 2
    }
  }
];

let nextRfqId = 2;

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

    const rfqNumber = generateRfqNumber();

    const rfq = {
      id: nextRfqId++,
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
      metadata: metadata || {},
      normalizedData: null,
      isNormalized: false,
      normalizationFlags: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: null,
      closedAt: null,
      buyerNotes: null,
      buyer: {
        id: req.user.id,
        email: req.user.email,
        firstName: 'Test',
        lastName: 'User',
        companyName: 'Test Company'
      },
      category: categoryId ? {
        id: categoryId,
        name: 'Mock Category',
        slug: 'mock-category'
      } : null
    };

    mockRfqs.push(rfq);

    res.status(201).json({
      message: 'RFQ created successfully (MOCK)',
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

    // Filter RFQs
    let filteredRfqs = [...mockRfqs];

    // Buyers see only their RFQs
    if (req.user.role === 'buyer') {
      filteredRfqs = filteredRfqs.filter(rfq => rfq.buyerId === req.user!.id);
    }

    if (status) {
      filteredRfqs = filteredRfqs.filter(rfq => rfq.status === status);
    }

    if (categoryId) {
      filteredRfqs = filteredRfqs.filter(rfq => rfq.categoryId === parseInt(categoryId as string));
    }

    if (deliveryCountry) {
      filteredRfqs = filteredRfqs.filter(rfq => rfq.deliveryCountry === deliveryCountry);
    }

    const total = filteredRfqs.length;
    const start = (pageNum - 1) * limitNum;
    const paginatedRfqs = filteredRfqs.slice(start, start + limitNum);

    res.status(200).json({
      message: 'RFQs fetched (MOCK)',
      data: paginatedRfqs,
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

    const { id } = req.params;
    const rfqId = parseInt(id);

    if (isNaN(rfqId)) {
      res.status(400).json({
        error: {
          code: 'INVALID_ID',
          message: 'Invalid RFQ ID'
        }
      });
      return;
    }

    const rfq = mockRfqs.find(r => r.id === rfqId);

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
      message: 'RFQ fetched (MOCK)',
      data: {
        ...rfq,
        rfqSuppliers: [],
        quotes: []
      }
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

    const { id } = req.params;
    const rfqId = parseInt(id);

    if (isNaN(rfqId)) {
      res.status(400).json({
        error: {
          code: 'INVALID_ID',
          message: 'Invalid RFQ ID'
        }
      });
      return;
    }

    const rfqIndex = mockRfqs.findIndex(r => r.id === rfqId);

    if (rfqIndex === -1) {
      res.status(404).json({
        error: {
          code: 'RFQ_NOT_FOUND',
          message: 'RFQ not found'
        }
      });
      return;
    }

    const rfq = mockRfqs[rfqIndex];

    if (req.user.role === 'buyer' && rfq.buyerId !== req.user.id) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this RFQ'
        }
      });
      return;
    }

    // Update fields
    const updates = req.body;
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        rfq[key] = updates[key];
      }
    });

    rfq.updatedAt = new Date();

    res.status(200).json({
      message: 'RFQ updated successfully (MOCK)',
      data: rfq
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

    const { id } = req.params;
    const rfqId = parseInt(id);

    if (isNaN(rfqId)) {
      res.status(400).json({
        error: {
          code: 'INVALID_ID',
          message: 'Invalid RFQ ID'
        }
      });
      return;
    }

    const rfq = mockRfqs.find(r => r.id === rfqId);

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

    rfq.status = 'open';
    rfq.publishedAt = new Date();

    res.status(200).json({
      message: 'RFQ published successfully (MOCK)',
      data: rfq
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

export const normalizeRfq = async (req: Request, res: Response): Promise<void> => {
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

    const { id } = req.params;
    const rfqId = parseInt(id);

    if (isNaN(rfqId)) {
      res.status(400).json({
        error: {
          code: 'INVALID_ID',
          message: 'Invalid RFQ ID'
        }
      });
      return;
    }

    const rfq = mockRfqs.find(r => r.id === rfqId);

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
          message: 'You do not have permission to normalize this RFQ'
        }
      });
      return;
    }

    // Process normalization
    const result = await normalizationService.processNormalization(rfq);

    // Update RFQ with normalization results
    rfq.isNormalized = result.isNormalized;
    rfq.normalizedData = result.normalizedData;
    rfq.normalizationFlags = result.validationFlags;
    rfq.updatedAt = new Date();

    res.status(200).json({
      message: 'RFQ normalized successfully (MOCK)',
      data: {
        rfq,
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
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to normalize RFQ'
      }
    });
  }
};

export const getMatchingSuppliers = async (req: Request, res: Response): Promise<void> => {
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

    const { id } = req.params;
    const rfqId = parseInt(id);

    if (isNaN(rfqId)) {
      res.status(400).json({
        error: {
          code: 'INVALID_ID',
          message: 'Invalid RFQ ID'
        }
      });
      return;
    }

    const rfq = mockRfqs.find(r => r.id === rfqId);

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
          message: 'You do not have permission to view matches for this RFQ'
        }
      });
      return;
    }

    // Get all suppliers
    const allSuppliers = getMockSuppliers();

    // Run matching algorithm
    const matches = supplierMatchingService.matchSuppliers(rfq, allSuppliers);

    // Add tier info to each match
    const matchesWithTiers = matches.map(match => ({
      ...match,
      tier: supplierMatchingService.getMatchTier(match.score)
    }));

    res.status(200).json({
      message: 'Supplier matches found (MOCK)',
      data: {
        rfqId,
        rfqNumber: rfq.rfqNumber,
        matchCount: matchesWithTiers.length,
        matches: matchesWithTiers
      }
    });
  } catch (error) {
    console.error('Get matching suppliers error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to find matching suppliers'
      }
    });
  }
};

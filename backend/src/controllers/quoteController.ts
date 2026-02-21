import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../config/database';
import { sendQuoteSubmittedEmail } from '../services/emailService';

/**
 * Get all quotes for an RFQ
 * GET /api/v1/rfqs/:id/quotes
 */
export const getQuotesForRfq = async (req: Request, res: Response): Promise<void> => {
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

    // Suppliers only see their own quotes — never competitors' bids
    const quoteWhere: any = { rfqId };
    if (req.user.role === 'supplier') {
      const supplierProfile = await prisma.supplier.findFirst({ where: { userId: req.user.id } });
      if (!supplierProfile) {
        res.status(200).json({ data: [] });
        return;
      }
      quoteWhere.supplierId = supplierProfile.id;
    }

    const quotes = await prisma.quote.findMany({
      where: quoteWhere,
      include: {
        supplier: {
          select: {
            id: true,
            companyName: true,
            country: true,
            supplierType: true,
            responsivenessScore: true
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { price: 'asc' }
      ]
    });

    res.status(200).json({ data: quotes });
  } catch (error) {
    console.error('Get quotes error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch quotes' } });
  }
};

/**
 * Submit a quote for an RFQ
 * POST /api/v1/rfqs/:id/quotes
 */
export const submitQuote = async (req: Request, res: Response): Promise<void> => {
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

    const {
      supplierId,
      unitPrice,
      totalPrice,
      currency = 'USD',
      leadTimeDays,
      validityDays = 30,
      notes,
      incoterms,
      paymentTerms,
      warranty,
      supplierName
    } = req.body;

    // Resolve the supplier record
    let resolvedSupplierId: number | null = null;

    if (req.user.role === 'supplier') {
      // Logged-in supplier: find their own supplier profile by userId
      const supplierProfile = await prisma.supplier.findFirst({
        where: { userId: req.user.id }
      });
      if (!supplierProfile) {
        res.status(400).json({ error: { code: 'NO_PROFILE', message: 'Supplier profile not found. Please complete your registration.' } });
        return;
      }
      resolvedSupplierId = supplierProfile.id;
    } else if (supplierId) {
      resolvedSupplierId = parseInt(supplierId);
    } else if (supplierName) {
      const supplier = await prisma.supplier.findFirst({
        where: { companyName: { contains: supplierName, mode: 'insensitive' } }
      });
      if (supplier) resolvedSupplierId = supplier.id;
    }

    if (!resolvedSupplierId) {
      res.status(400).json({ error: { code: 'NO_ASSIGNMENT', message: 'Could not identify supplier for this quote' } });
      return;
    }

    // Upsert rfqSupplier — auto-assign if not already linked
    const rfqSupplier = await prisma.rfqSupplier.upsert({
      where: { rfqId_supplierId: { rfqId, supplierId: resolvedSupplierId } },
      update: { status: 'submitted', submittedAt: new Date() },
      create: { rfqId, supplierId: resolvedSupplierId, status: 'submitted', submittedAt: new Date() }
    });

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validityDays);

    const leadTimeWeeks = leadTimeDays ? Math.ceil(leadTimeDays / 7) : null;

    const quote = await prisma.quote.create({
      data: {
        rfqSupplierId: rfqSupplier.id,
        rfqId,
        supplierId: rfqSupplier.supplierId,
        price: totalPrice || unitPrice,
        currency,
        leadTimeWeeks,
        incoterm: incoterms,
        paymentTerms,
        warrantyDescription: warranty,
        validUntil,
        notes,
        status: 'submitted',
        submittedAt: new Date()
      },
      include: {
        supplier: { select: { id: true, companyName: true, country: true } }
      }
    });

    // Update rfqSupplier status
    await prisma.rfqSupplier.update({
      where: { id: rfqSupplier.id },
      data: { status: 'submitted', submittedAt: new Date() }
    });

    // Send email notification to the buyer (fire-and-forget)
    prisma.rfq.findUnique({
      where: { id: rfqId },
      include: {
        buyer: { select: { email: true, firstName: true, lastName: true, companyName: true } }
      }
    }).then(rfqWithBuyer => {
      if (rfqWithBuyer?.buyer?.email) {
        const buyerName = [rfqWithBuyer.buyer.firstName, rfqWithBuyer.buyer.lastName].filter(Boolean).join(' ')
          || rfqWithBuyer.buyer.companyName
          || rfqWithBuyer.buyer.email;
        return sendQuoteSubmittedEmail({
          buyerEmail: rfqWithBuyer.buyer.email,
          buyerName,
          rfqNumber: rfqWithBuyer.rfqNumber,
          rfqProjectName: rfqWithBuyer.projectName,
          rfqId,
          supplierCompanyName: quote.supplier.companyName,
          price: Number(quote.price),
          currency: quote.currency,
        });
      }
    }).catch(err => {
      console.error('Failed to send quote notification email:', err);
    });

    res.status(201).json({ message: 'Quote submitted successfully', data: quote });
  } catch (error) {
    console.error('Submit quote error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to submit quote' } });
  }
};

/**
 * Update quote status (shortlist / award / reject)
 * PATCH /api/v1/rfqs/:id/quotes/:quoteId/status
 */
export const updateQuoteStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }

    const rfqId = parseInt(req.params.id as string);
    const quoteId = parseInt(req.params.quoteId as string);

    if (isNaN(rfqId) || isNaN(quoteId)) {
      res.status(400).json({ error: { code: 'INVALID_ID', message: 'Invalid ID' } });
      return;
    }

    const { status } = req.body;
    const validStatuses = ['submitted', 'awarded', 'rejected', 'withdrawn'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({
        error: { code: 'INVALID_STATUS', message: `Status must be one of: ${validStatuses.join(', ')}` }
      });
      return;
    }

    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, rfqId }
    });

    if (!quote) {
      res.status(404).json({ error: { code: 'QUOTE_NOT_FOUND', message: 'Quote not found' } });
      return;
    }

    const rfq = await prisma.rfq.findUnique({ where: { id: rfqId } });
    if (req.user.role === 'buyer' && rfq && rfq.buyerId !== req.user.id) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied' } });
      return;
    }

    // If awarding, reject all other quotes for this RFQ
    if (status === 'awarded') {
      await prisma.quote.updateMany({
        where: { rfqId, id: { not: quoteId }, status: { not: 'withdrawn' } },
        data: { status: 'rejected' }
      });
      // Update RFQ status to awarded
      await prisma.rfq.update({
        where: { id: rfqId },
        data: { status: 'awarded' }
      });
    }

    const updated = await prisma.quote.update({
      where: { id: quoteId },
      data: { status },
      include: {
        supplier: { select: { id: true, companyName: true, country: true } }
      }
    });

    res.status(200).json({ message: `Quote ${status} successfully`, data: updated });
  } catch (error) {
    console.error('Update quote status error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to update quote status' } });
  }
};

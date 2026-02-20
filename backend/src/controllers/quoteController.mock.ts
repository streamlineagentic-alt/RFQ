import { Request, Response } from 'express';
import { validationResult } from 'express-validator';

// Mock quote database (in-memory)
const mockQuotes: any[] = [
  {
    id: 1,
    rfqId: 1,
    supplierId: 1,
    supplierName: 'Global Manufacturing Co.',
    supplierCountry: 'USA',
    unitPrice: 12500.00,
    totalPrice: 62500.00,
    currency: 'USD',
    leadTimeDays: 30,
    validityDays: 60,
    notes: 'Includes installation and first-year maintenance. ISO 9001 certified manufacturing.',
    status: 'pending',
    incoterms: 'DDP',
    paymentTerms: 'Net 30',
    warranty: '24 months',
    attachmentUrl: null,
    createdAt: new Date('2026-02-05'),
    updatedAt: new Date('2026-02-05')
  },
  {
    id: 2,
    rfqId: 1,
    supplierId: 3,
    supplierName: 'European Materials Ltd.',
    supplierCountry: 'Germany',
    unitPrice: 14200.00,
    totalPrice: 71000.00,
    currency: 'EUR',
    leadTimeDays: 21,
    validityDays: 45,
    notes: 'Premium build quality, CE certified. Faster delivery possible for additional fee.',
    status: 'shortlisted',
    incoterms: 'CIF',
    paymentTerms: '50% upfront, 50% on delivery',
    warranty: '36 months',
    attachmentUrl: null,
    createdAt: new Date('2026-02-06'),
    updatedAt: new Date('2026-02-06')
  }
];

let nextQuoteId = 3;

export const getMockQuotes = () => mockQuotes;

export const getQuotesForRfq = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }

    const rfqId = parseInt(req.params.id);
    if (isNaN(rfqId)) {
      res.status(400).json({ error: { code: 'INVALID_ID', message: 'Invalid RFQ ID' } });
      return;
    }

    const quotes = mockQuotes.filter(q => q.rfqId === rfqId);

    // Sort: awarded first, then shortlisted, then pending, then rejected
    const statusOrder: Record<string, number> = { awarded: 0, shortlisted: 1, pending: 2, rejected: 3 };
    quotes.sort((a, b) => (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99));

    res.status(200).json({
      message: 'Quotes fetched (MOCK)',
      data: quotes,
      total: quotes.length
    });
  } catch (error) {
    console.error('Get quotes error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch quotes' } });
  }
};

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

    const rfqId = parseInt(req.params.id);
    if (isNaN(rfqId)) {
      res.status(400).json({ error: { code: 'INVALID_ID', message: 'Invalid RFQ ID' } });
      return;
    }

    const {
      supplierName,
      supplierCountry,
      unitPrice,
      totalPrice,
      currency,
      leadTimeDays,
      validityDays,
      notes,
      incoterms,
      paymentTerms,
      warranty
    } = req.body;

    const quote = {
      id: nextQuoteId++,
      rfqId,
      supplierId: null,
      supplierName: supplierName || 'Unknown Supplier',
      supplierCountry: supplierCountry || 'Unknown',
      unitPrice: parseFloat(unitPrice),
      totalPrice: totalPrice ? parseFloat(totalPrice) : parseFloat(unitPrice),
      currency: currency || 'USD',
      leadTimeDays: parseInt(leadTimeDays),
      validityDays: validityDays ? parseInt(validityDays) : 30,
      notes: notes || '',
      status: 'pending',
      incoterms: incoterms || 'EXW',
      paymentTerms: paymentTerms || 'Net 30',
      warranty: warranty || 'N/A',
      attachmentUrl: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockQuotes.push(quote);

    res.status(201).json({
      message: 'Quote submitted successfully (MOCK)',
      data: quote
    });
  } catch (error) {
    console.error('Submit quote error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to submit quote' } });
  }
};

export const updateQuoteStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }

    const rfqId = parseInt(req.params.id);
    const quoteId = parseInt(req.params.quoteId);

    if (isNaN(rfqId) || isNaN(quoteId)) {
      res.status(400).json({ error: { code: 'INVALID_ID', message: 'Invalid ID' } });
      return;
    }

    const { status } = req.body;
    const validStatuses = ['pending', 'shortlisted', 'rejected', 'awarded'];

    if (!validStatuses.includes(status)) {
      res.status(400).json({
        error: { code: 'INVALID_STATUS', message: `Status must be one of: ${validStatuses.join(', ')}` }
      });
      return;
    }

    const quoteIndex = mockQuotes.findIndex(q => q.id === quoteId && q.rfqId === rfqId);

    if (quoteIndex === -1) {
      res.status(404).json({ error: { code: 'QUOTE_NOT_FOUND', message: 'Quote not found' } });
      return;
    }

    // If awarding, reject all others for this RFQ
    if (status === 'awarded') {
      mockQuotes.forEach(q => {
        if (q.rfqId === rfqId && q.id !== quoteId && q.status !== 'rejected') {
          q.status = 'rejected';
          q.updatedAt = new Date();
        }
      });
    }

    mockQuotes[quoteIndex].status = status;
    mockQuotes[quoteIndex].updatedAt = new Date();

    res.status(200).json({
      message: `Quote ${status} successfully (MOCK)`,
      data: mockQuotes[quoteIndex]
    });
  } catch (error) {
    console.error('Update quote status error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to update quote status' } });
  }
};

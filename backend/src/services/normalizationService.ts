import { Request } from 'express';

interface ValidationFlag {
  field: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

interface NormalizedRfq {
  rfqNumber: string;
  project: {
    name: string;
    description: string;
    specifications?: string;
  };
  category: {
    id?: number;
    name?: string;
    industry?: string;
  };
  delivery: {
    country?: string;
    city?: string;
    address?: string;
    windowStart?: string;
    windowEnd?: string;
  };
  quantity?: {
    value: number;
    unit: string;
  };
  timeline: {
    responseDeadline?: string;
    createdAt: string;
  };
  buyer: {
    id: number;
    email: string;
    company?: string;
  };
}

export class NormalizationService {
  /**
   * Validate RFQ data and generate validation flags
   */
  validateRfq(rfq: any): ValidationFlag[] {
    const flags: ValidationFlag[] = [];

    // Required field validations
    if (!rfq.projectName || rfq.projectName.trim() === '') {
      flags.push({
        field: 'projectName',
        severity: 'error',
        message: 'Project name is required'
      });
    }

    if (!rfq.description || rfq.description.trim() === '') {
      flags.push({
        field: 'description',
        severity: 'error',
        message: 'Description is required'
      });
    }

    // Data quality warnings
    if (rfq.projectName && rfq.projectName.length < 10) {
      flags.push({
        field: 'projectName',
        severity: 'warning',
        message: 'Project name is very short. Consider providing more detail.'
      });
    }

    if (rfq.description && rfq.description.length < 50) {
      flags.push({
        field: 'description',
        severity: 'warning',
        message: 'Description is brief. More detail helps suppliers provide accurate quotes.'
      });
    }

    if (!rfq.specifications || rfq.specifications.trim() === '') {
      flags.push({
        field: 'specifications',
        severity: 'warning',
        message: 'Technical specifications not provided. This may result in inaccurate quotes.'
      });
    }

    // Category validation
    if (!rfq.categoryId && !rfq.industry) {
      flags.push({
        field: 'category',
        severity: 'warning',
        message: 'No category or industry specified. This may affect supplier matching.'
      });
    }

    // Delivery information validation
    if (!rfq.deliveryCountry) {
      flags.push({
        field: 'deliveryCountry',
        severity: 'warning',
        message: 'Delivery country not specified'
      });
    }

    if (!rfq.deliveryWindowStart && !rfq.deliveryWindowEnd) {
      flags.push({
        field: 'deliveryWindow',
        severity: 'info',
        message: 'No delivery window specified. Consider adding expected delivery dates.'
      });
    }

    // Quantity validation
    if (!rfq.quantity || rfq.quantity <= 0) {
      flags.push({
        field: 'quantity',
        severity: 'warning',
        message: 'Quantity not specified or invalid'
      });
    }

    // Timeline validation
    if (!rfq.responseDeadline) {
      flags.push({
        field: 'responseDeadline',
        severity: 'warning',
        message: 'No response deadline specified'
      });
    } else {
      const deadline = new Date(rfq.responseDeadline);
      const now = new Date();
      const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilDeadline < 0) {
        flags.push({
          field: 'responseDeadline',
          severity: 'error',
          message: 'Response deadline is in the past'
        });
      } else if (daysUntilDeadline < 3) {
        flags.push({
          field: 'responseDeadline',
          severity: 'warning',
          message: `Response deadline is very soon (${daysUntilDeadline} days). Suppliers may not have enough time to respond.`
        });
      }
    }

    return flags;
  }

  /**
   * Normalize RFQ data into standardized JSON format
   */
  normalizeRfq(rfq: any): NormalizedRfq {
    return {
      rfqNumber: rfq.rfqNumber,
      project: {
        name: rfq.projectName?.trim() || '',
        description: rfq.description?.trim() || '',
        specifications: rfq.specifications?.trim() || undefined
      },
      category: {
        id: rfq.categoryId || undefined,
        name: rfq.category?.name || undefined,
        industry: rfq.industry?.trim() || undefined
      },
      delivery: {
        country: rfq.deliveryCountry?.trim() || undefined,
        city: rfq.deliveryCity?.trim() || undefined,
        address: rfq.deliveryAddress?.trim() || undefined,
        windowStart: rfq.deliveryWindowStart ? new Date(rfq.deliveryWindowStart).toISOString() : undefined,
        windowEnd: rfq.deliveryWindowEnd ? new Date(rfq.deliveryWindowEnd).toISOString() : undefined
      },
      quantity: rfq.quantity ? {
        value: parseFloat(rfq.quantity),
        unit: rfq.quantityUom || 'units'
      } : undefined,
      timeline: {
        responseDeadline: rfq.responseDeadline ? new Date(rfq.responseDeadline).toISOString() : undefined,
        createdAt: new Date(rfq.createdAt).toISOString()
      },
      buyer: {
        id: rfq.buyer?.id || rfq.buyerId,
        email: rfq.buyer?.email || '',
        company: rfq.buyer?.companyName || undefined
      }
    };
  }

  /**
   * Calculate data quality score (0-100)
   */
  calculateQualityScore(flags: ValidationFlag[]): number {
    const errorCount = flags.filter(f => f.severity === 'error').length;
    const warningCount = flags.filter(f => f.severity === 'warning').length;
    const infoCount = flags.filter(f => f.severity === 'info').length;

    // Start at 100 and deduct points
    let score = 100;
    score -= errorCount * 20; // -20 per error
    score -= warningCount * 10; // -10 per warning
    score -= infoCount * 5; // -5 per info

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Main normalization function
   */
  async processNormalization(rfq: any): Promise<{
    isNormalized: boolean;
    normalizedData: NormalizedRfq;
    validationFlags: ValidationFlag[];
    qualityScore: number;
  }> {
    // Validate RFQ
    const validationFlags = this.validateRfq(rfq);

    // Check if there are any errors
    const hasErrors = validationFlags.some(f => f.severity === 'error');

    // Normalize data
    const normalizedData = this.normalizeRfq(rfq);

    // Calculate quality score
    const qualityScore = this.calculateQualityScore(validationFlags);

    return {
      isNormalized: !hasErrors,
      normalizedData,
      validationFlags,
      qualityScore
    };
  }
}

export const normalizationService = new NormalizationService();

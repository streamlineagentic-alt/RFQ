interface MatchScore {
  supplierId: number;
  supplier: any;
  score: number;
  matchReasons: string[];
}

export class SupplierMatchingService {
  /**
   * Match suppliers to an RFQ based on multiple criteria
   */
  matchSuppliers(rfq: any, suppliers: any[]): MatchScore[] {
    const matches: MatchScore[] = [];

    for (const supplier of suppliers) {
      if (!supplier.isActive) continue;

      let score = 0;
      const matchReasons: string[] = [];

      // Category matching (40 points)
      if (rfq.categoryId && supplier.categories) {
        if (supplier.categories.includes(rfq.categoryId)) {
          score += 40;
          matchReasons.push('Matches required category');
        }
      }

      // Region/Country matching (30 points)
      if (rfq.deliveryCountry && supplier.regions) {
        // Map countries to regions
        const countryRegionMap: { [key: string]: string } = {
          'USA': 'North America',
          'Canada': 'North America',
          'UK': 'Europe',
          'Germany': 'Europe',
          'France': 'Europe',
          'China': 'Asia',
          'Japan': 'Asia',
          'India': 'Asia'
        };

        const requiredRegion = countryRegionMap[rfq.deliveryCountry];
        if (requiredRegion && supplier.regions.includes(requiredRegion)) {
          score += 30;
          matchReasons.push(`Serves ${requiredRegion} region`);
        } else if (supplier.country === rfq.deliveryCountry) {
          score += 25;
          matchReasons.push('Located in delivery country');
        }
      }

      // Supplier rating (20 points)
      if (supplier.rating) {
        const ratingScore = (supplier.rating / 5) * 20;
        score += ratingScore;
        if (supplier.rating >= 4.5) {
          matchReasons.push('Highly rated supplier');
        } else if (supplier.rating >= 4.0) {
          matchReasons.push('Well-rated supplier');
        }
      }

      // Certifications bonus (10 points)
      if (supplier.certifications && supplier.certifications.length > 0) {
        const certBonus = Math.min(supplier.certifications.length * 3, 10);
        score += certBonus;
        matchReasons.push(`${supplier.certifications.length} certifications`);
      }

      // Only include suppliers with some match
      if (score > 0) {
        matches.push({
          supplierId: supplier.id,
          supplier,
          score,
          matchReasons
        });
      }
    }

    // Sort by score (highest first)
    matches.sort((a, b) => b.score - a.score);

    return matches;
  }

  /**
   * Get match quality tier
   */
  getMatchTier(score: number): {
    tier: 'excellent' | 'good' | 'fair' | 'poor';
    color: string;
    label: string;
  } {
    if (score >= 80) {
      return { tier: 'excellent', color: 'green', label: 'Excellent Match' };
    } else if (score >= 60) {
      return { tier: 'good', color: 'blue', label: 'Good Match' };
    } else if (score >= 40) {
      return { tier: 'fair', color: 'yellow', label: 'Fair Match' };
    } else {
      return { tier: 'poor', color: 'gray', label: 'Poor Match' };
    }
  }
}

export const supplierMatchingService = new SupplierMatchingService();

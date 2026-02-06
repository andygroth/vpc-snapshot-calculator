/**
 * IBM Cloud VPC Snapshot Pricing Data
 * 
 * Last Updated: 2026-02-05
 * Source: IBM Cloud Pricing Documentation
 * 
 * IMPORTANT: Pricing should be verified at:
 * https://www.ibm.com/cloud/vpc/pricing
 * 
 * Note: Actual pricing may vary by region, volume type, and commitment level.
 * The values below are approximate and should be verified before making
 * business decisions.
 */

export const pricingData = {
  lastUpdated: '2026-02-05T00:00:00Z',
  source: 'https://www.ibm.com/cloud/vpc/pricing',
  
  // Regional pricing (USD per GB per month)
  regions: {
    'us-south': {
      name: 'US South (Dallas)',
      pricePerGB: 0.05,
      currency: 'USD'
    },
    'us-east': {
      name: 'US East (Washington DC)',
      pricePerGB: 0.05,
      currency: 'USD'
    },
    'eu-gb': {
      name: 'United Kingdom (London)',
      pricePerGB: 0.055,
      currency: 'USD'
    },
    'eu-de': {
      name: 'Germany (Frankfurt)',
      pricePerGB: 0.055,
      currency: 'USD'
    },
    'jp-tok': {
      name: 'Japan (Tokyo)',
      pricePerGB: 0.06,
      currency: 'USD'
    },
    'jp-osa': {
      name: 'Japan (Osaka)',
      pricePerGB: 0.06,
      currency: 'USD'
    },
    'au-syd': {
      name: 'Australia (Sydney)',
      pricePerGB: 0.06,
      currency: 'USD'
    },
    'ca-tor': {
      name: 'Canada (Toronto)',
      pricePerGB: 0.05,
      currency: 'USD'
    },
    'br-sao': {
      name: 'Brazil (São Paulo)',
      pricePerGB: 0.07,
      currency: 'USD'
    }
  },
  
  defaultRegion: 'us-south',
  
  notes: [
    'Pricing is subject to change. Always verify current rates at IBM Cloud pricing page.',
    'Prices shown are for standard snapshot storage.',
    'No additional charges for snapshot create/delete operations.',
    'Snapshots must be in the same region as the source volume.',
    'Cross-region snapshot copies may incur additional data transfer charges.',
    'Enterprise discounts and committed use discounts may apply.'
  ],
  
  // Pricing assumptions for calculations
  assumptions: [
    'All snapshots are incremental and only store changed data blocks',
    'IBM Cloud charges only for the delta (changed data), even for the first snapshot',
    'Storage is billed based on actual data stored, not allocated capacity',
    'Pricing is calculated on a monthly basis (730 hours)',
    'Each system maintains its own set of snapshots per schedule'
  ]
};

/**
 * Get pricing for a specific region
 * @param {string} regionCode - Region code (e.g., 'us-south')
 * @returns {object} Region pricing information
 */
export function getRegionPricing(regionCode = 'us-south') {
  return pricingData.regions[regionCode] || pricingData.regions[pricingData.defaultRegion];
}

/**
 * Get all available regions
 * @returns {array} Array of region objects with code, name, and price
 */
export function getAllRegions() {
  return Object.entries(pricingData.regions).map(([code, data]) => ({
    code,
    name: data.name,
    pricePerGB: data.pricePerGB,
    currency: data.currency
  }));
}

/**
 * Format currency value
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: 'USD')
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format storage size
 * @param {number} sizeGB - Size in GB
 * @returns {string} Formatted storage string
 */
export function formatStorage(sizeGB) {
  if (sizeGB >= 1024) {
    return `${(sizeGB / 1024).toFixed(2)} TB`;
  }
  return `${sizeGB.toFixed(2)} GB`;
}

/**
 * Get pricing verification message
 * @returns {string} Message about pricing verification
 */
export function getPricingVerificationMessage() {
  const lastUpdated = new Date(pricingData.lastUpdated);
  const formattedDate = lastUpdated.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  return `Pricing last verified: ${formattedDate}. Please verify current rates at ${pricingData.source}`;
}

// Made with Bob

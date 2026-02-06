import { InlineNotification, Link } from '@carbon/react';
import { getPricingVerificationMessage, pricingData } from '../utils/pricing';

/**
 * PricingInfo Component
 * 
 * Displays pricing information and verification details:
 * - Last updated date
 * - Source link
 * - Important notes about pricing
 */
function PricingInfo() {
  return (
    <div className="pricing-info-container">
      <InlineNotification
        kind="info"
        title="Pricing Information"
        subtitle={getPricingVerificationMessage()}
        lowContrast
        hideCloseButton
      />

      <div className="pricing-details">
        <h4>Important Notes:</h4>
        <ul>
          {pricingData.notes.map((note, index) => (
            <li key={index}>{note}</li>
          ))}
        </ul>

        <div className="pricing-source">
          <strong>Verify current pricing at:</strong>{' '}
          <Link href={pricingData.source} target="_blank" rel="noopener noreferrer">
            IBM Cloud VPC Pricing
          </Link>
        </div>

        <div className="pricing-assumptions">
          <h4>Calculation Assumptions:</h4>
          <ul>
            {pricingData.assumptions.map((assumption, index) => (
              <li key={index}>{assumption}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default PricingInfo;

// Made with Bob

import { 
  Tile,
  Select,
  SelectItem,
  NumberInput,
  Toggle,
  Stack
} from '@carbon/react';
import { getAllRegions } from '../utils/pricing';

/**
 * RegionPricingSelector Component
 * 
 * Allows users to:
 * - Select cloud region
 * - View region-specific pricing
 * - Override pricing if needed
 */
function RegionPricingSelector({ value, onChange }) {
  const regions = getAllRegions();

  const handleRegionChange = (e) => {
    const selectedRegion = regions.find(r => r.code === e.target.value);
    onChange({
      ...value,
      regionCode: selectedRegion.code,
      region: selectedRegion.name,
      pricePerGB: value.overrideEnabled ? value.pricePerGB : selectedRegion.pricePerGB,
      currency: selectedRegion.currency
    });
  };

  const handleOverrideToggle = (checked) => {
    const selectedRegion = regions.find(r => r.code === value.regionCode);
    onChange({
      ...value,
      overrideEnabled: checked,
      pricePerGB: checked ? value.pricePerGB : selectedRegion.pricePerGB
    });
  };

  const handlePriceChange = (e, { value: newValue }) => {
    if (value.overrideEnabled && newValue !== '') {
      onChange({
        ...value,
        pricePerGB: parseFloat(newValue)
      });
    }
  };

  return (
    <Tile className="region-pricing-tile">
      <Stack gap={5}>
        <div>
          <h3 className="section-heading">Region & Pricing</h3>
          <p className="section-description">
            Select your IBM Cloud region and verify pricing
          </p>
        </div>

        <Select
          id="region-select"
          labelText="Cloud Region"
          value={value.regionCode}
          onChange={handleRegionChange}
        >
          {regions.map((region) => (
            <SelectItem
              key={region.code}
              value={region.code}
              text={`${region.name} - ${region.pricePerGB.toFixed(3)} ${region.currency}/GB/month`}
            />
          ))}
        </Select>

        <div className="pricing-override-section">
          <Toggle
            id="pricing-override-toggle"
            labelText="Override pricing"
            labelA="Use region pricing"
            labelB="Custom pricing"
            toggled={value.overrideEnabled}
            onToggle={handleOverrideToggle}
          />
          
          {value.overrideEnabled && (
            <NumberInput
              id="price-override"
              label="Price per GB per month"
              helperText="Enter custom pricing if region pricing is outdated"
              value={value.pricePerGB}
              onChange={handlePriceChange}
              min={0}
              max={1}
              step={0.001}
              invalidText="Price must be between 0 and 1"
            />
          )}
        </div>

        <div className="pricing-info-box">
          <p className="note-text">
            <strong>Current Rate:</strong> {value.pricePerGB.toFixed(3)} {value.currency}/GB/month
            {value.overrideEnabled && ' (Custom)'}
          </p>
          <p className="note-text" style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
            Always verify current pricing at{' '}
            <a 
              href="https://www.ibm.com/cloud/vpc/pricing" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              IBM Cloud VPC Pricing
            </a>
          </p>
        </div>
      </Stack>
    </Tile>
  );
}

export default RegionPricingSelector;

// Made with Bob

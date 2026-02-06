import { useState, useEffect } from 'react';
import { RadioButtonGroup, RadioButton, NumberInput, Tile, Stack } from '@carbon/react';

/**
 * ChangeRateSelector Component
 * 
 * Allows users to select data change rate:
 * - Low: 5% daily change
 * - Medium: 20% daily change (default)
 * - High: 40% daily change
 * - Custom: User-defined percentage
 */
function ChangeRateSelector({ value, onChange, errors = {} }) {
  const [preset, setPreset] = useState(value?.preset || 'medium');
  const [customValue, setCustomValue] = useState(value?.customValue || 20);

  useEffect(() => {
    onChange({
      preset,
      customValue,
      dailyRate: getDailyRate()
    });
  }, [preset, customValue]);

  const getDailyRate = () => {
    const presets = {
      low: 0.05,
      medium: 0.20,
      high: 0.40
    };

    if (preset === 'custom') {
      return customValue / 100;
    }

    return presets[preset] || presets.medium;
  };

  const getDescription = (presetType) => {
    const descriptions = {
      low: 'Typical for production databases with stable data (5% daily change)',
      medium: 'Standard for most enterprise workloads (20% daily change)',
      high: 'Development/test environments with frequent changes (40% daily change)',
      custom: 'Define your own change rate percentage'
    };
    return descriptions[presetType];
  };

  return (
    <Tile className="change-rate-tile">
      <Stack gap={6}>
        <h3 className="section-heading">Data Change Rate</h3>
        <p className="section-description">
          Select the expected daily data change rate for your volumes. This affects
          the size of incremental snapshots.
        </p>

        <RadioButtonGroup
          legendText="Change Rate Preset"
          name="change-rate-preset"
          valueSelected={preset}
          onChange={(value) => setPreset(value)}
        >
          <RadioButton
            labelText="Low (5%)"
            value="low"
            id="rate-low"
          />
          <RadioButton
            labelText="Medium (20%)"
            value="medium"
            id="rate-medium"
          />
          <RadioButton
            labelText="High (40%)"
            value="high"
            id="rate-high"
          />
          <RadioButton
            labelText="Custom"
            value="custom"
            id="rate-custom"
          />
        </RadioButtonGroup>

        <div className="change-rate-description">
          <em>{getDescription(preset)}</em>
        </div>

        {preset === 'custom' && (
          <NumberInput
            id="custom-change-rate"
            label="Custom Change Rate (%)"
            helperText="Enter daily change rate as a percentage (0-100)"
            min={0}
            max={100}
            step={1}
            value={customValue}
            onChange={(e, { value }) => {
              if (value !== '') {
                setCustomValue(Number(value));
              }
            }}
            invalid={!!errors.customValue}
            invalidText={errors.customValue}
            allowEmpty={false}
          />
        )}

        <div className="effective-rate-display">
          <strong>Effective Daily Change Rate:</strong>{' '}
          <span className="effective-rate-value">
            {(getDailyRate() * 100).toFixed(1)}%
          </span>
        </div>
      </Stack>
    </Tile>
  );
}

export default ChangeRateSelector;

// Made with Bob

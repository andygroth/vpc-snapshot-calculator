import { useState, useEffect } from 'react';
import { NumberInput, Tile, Stack } from '@carbon/react';

/**
 * VolumeInput Component
 * 
 * Allows users to configure the data volume by specifying:
 * - Number of systems
 * - Average volume size per system (in GB)
 * 
 * Automatically calculates and displays total volume.
 */
function VolumeInput({ value, onChange, errors = {} }) {
  const [systemCount, setSystemCount] = useState(value?.systemCount || 1);
  const [volumeSize, setVolumeSize] = useState(value?.volumeSize || 100);

  // Calculate total volume whenever inputs change
  useEffect(() => {
    const totalVolume = systemCount * volumeSize;
    onChange({
      systemCount,
      volumeSize,
      totalVolume
    });
  }, [systemCount, volumeSize]);

  return (
    <Tile className="volume-input-tile">
      <Stack gap={6}>
        <h3 className="section-heading">Data Volume Configuration</h3>
        
        <NumberInput
          id="system-count"
          label="Number of Systems"
          helperText="Total number of systems with block storage volumes"
          min={1}
          max={10000}
          step={1}
          value={systemCount}
          onChange={(e, { value }) => {
            if (value !== '') {
              setSystemCount(Number(value));
            }
          }}
          invalid={!!errors.systemCount}
          invalidText={errors.systemCount}
          allowEmpty={false}
        />

        <NumberInput
          id="volume-size"
          label="Average Volume Size per System (GB)"
          helperText="Average size of block storage volume per system"
          min={1}
          max={100000}
          step={10}
          value={volumeSize}
          onChange={(e, { value }) => {
            if (value !== '') {
              setVolumeSize(Number(value));
            }
          }}
          invalid={!!errors.volumeSize}
          invalidText={errors.volumeSize}
          allowEmpty={false}
        />

        <div className="total-volume-display">
          <strong>Total Base Volume:</strong>{' '}
          <span className="total-volume-value">
            {(systemCount * volumeSize).toLocaleString()} GB
            {systemCount * volumeSize >= 1024 && (
              <span className="total-volume-tb">
                {' '}({((systemCount * volumeSize) / 1024).toFixed(2)} TB)
              </span>
            )}
          </span>
        </div>
      </Stack>
    </Tile>
  );
}

export default VolumeInput;

// Made with Bob

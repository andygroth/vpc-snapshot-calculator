import { useState, useEffect } from 'react';
import { 
  Content, 
  Grid, 
  Column,
  Theme
} from '@carbon/react';
import VolumeInput from './components/VolumeInput';
import ChangeRateSelector from './components/ChangeRateSelector';
import ScheduleConfig from './components/ScheduleConfig';
import RegionPricingSelector from './components/RegionPricingSelector';
import ResultsDisplay from './components/ResultsDisplay';
import PricingInfo from './components/PricingInfo';
import { 
  calculateSnapshotCosts,
  getDefaultSchedules,
  validateVolume,
  validateChangeRate,
  validateSchedules
} from './utils/calculations';
import { getRegionPricing } from './utils/pricing';
import './App.scss';

/**
 * Main App Component
 * 
 * IBM Cloud VPC Snapshot Cost Calculator
 * Calculates monthly costs for block storage snapshots based on:
 * - Data volume (systems × volume size)
 * - Change rate (low/medium/high/custom)
 * - Snapshot schedules (hourly/daily/weekly/monthly)
 * - Retention policies
 */
function App() {
  // State management
  const [volume, setVolume] = useState({
    systemCount: 1,
    volumeSize: 100,
    totalVolume: 100
  });

  const [changeRate, setChangeRate] = useState({
    preset: 'medium',
    customValue: 20,
    dailyRate: 0.20
  });

  const [schedules, setSchedules] = useState(getDefaultSchedules());
  
  const [pricing, setPricing] = useState({
    regionCode: 'us-south',
    region: 'US South (Dallas)',
    pricePerGB: 0.05,
    currency: 'USD',
    overrideEnabled: false
  });

  const [results, setResults] = useState(null);
  
  const [errors, setErrors] = useState({
    volume: {},
    changeRate: {},
    schedules: {}
  });

  // Calculate costs whenever inputs change
  useEffect(() => {
    // Validate inputs
    const volumeValidation = validateVolume(volume);
    const changeRateValidation = validateChangeRate(changeRate);
    const schedulesValidation = validateSchedules(schedules);

    setErrors({
      volume: volumeValidation.errors,
      changeRate: changeRateValidation.errors,
      schedules: schedulesValidation.errors
    });

    // Only calculate if all inputs are valid
    if (
      volumeValidation.isValid &&
      changeRateValidation.isValid &&
      schedulesValidation.isValid
    ) {
      const calculationResults = calculateSnapshotCosts({
        volume,
        changeRate,
        schedules,
        pricing
      });
      setResults(calculationResults);
    } else {
      setResults(null);
    }
  }, [volume, changeRate, schedules, pricing]);

  return (
    <Theme theme="g100">
      <div className="app-container">
        <header className="app-header">
          <Content>
            <Grid>
              <Column lg={16} md={8} sm={4}>
                <h1 className="app-title">
                  IBM Cloud VPC Snapshot Calculator
                </h1>
                <p className="app-subtitle">
                  Estimate monthly costs for block storage snapshots based on your
                  volume configuration, change rates, and retention policies.
                </p>
              </Column>
            </Grid>
          </Content>
        </header>

        <main className="app-main">
          <Content>
            <Grid>
              {/* Configuration Section */}
              <Column lg={8} md={8} sm={4} className="config-column">
                <div className="config-section">
                  <h2 className="config-heading">Configuration</h2>
                  
                  <VolumeInput
                    value={volume}
                    onChange={setVolume}
                    errors={errors.volume}
                  />

                  <ChangeRateSelector
                    value={changeRate}
                    onChange={setChangeRate}
                    errors={errors.changeRate}
                  />

                  <ScheduleConfig
                    schedules={schedules}
                    onChange={setSchedules}
                    errors={errors.schedules}
                  />

                  <RegionPricingSelector
                    value={pricing}
                    onChange={setPricing}
                  />
                </div>
              </Column>

              {/* Results Section */}
              <Column lg={8} md={8} sm={4} className="results-column">
                <div className="results-section">
                  <h2 className="results-heading">Results</h2>
                  
                  <ResultsDisplay
                    results={results}
                    pricing={pricing}
                  />

                  <PricingInfo />
                </div>
              </Column>
            </Grid>
          </Content>
        </main>

        <footer className="app-footer">
          <Content>
            <Grid>
              <Column lg={16} md={8} sm={4}>
                <p className="footer-text">
                  IBM Cloud VPC Snapshot Calculator | 
                  Built with IBM Carbon Design System | 
                  <a 
                    href="https://www.ibm.com/cloud/vpc/pricing" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="footer-link"
                  >
                    Verify Pricing
                  </a>
                </p>
              </Column>
            </Grid>
          </Content>
        </footer>
      </div>
    </Theme>
  );
}

export default App;

// Made with Bob

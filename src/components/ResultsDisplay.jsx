import {
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Tile,
  Stack,
  Accordion,
  AccordionItem
} from '@carbon/react';
import { formatCurrency, formatStorage } from '../utils/pricing';
import { getScheduleTypeName, calculateAnnualCost } from '../utils/calculations';

/**
 * ResultsDisplay Component
 * 
 * Displays calculated snapshot costs:
 * - Per-schedule breakdown
 * - Total monthly and annual costs
 * - Storage usage details
 */
function ResultsDisplay({ results, pricing }) {
  if (!results || !results.scheduleBreakdown || results.scheduleBreakdown.length === 0) {
    return (
      <Tile className="results-display-tile">
        <div className="no-results">
          <h3>Cost Calculation Results</h3>
          <p>Configure your volume, change rate, and schedules to see cost estimates.</p>
        </div>
      </Tile>
    );
  }

  const headers = [
    { key: 'schedule', header: 'Schedule Type' },
    { key: 'retention', header: 'Snapshots Retained' },
    { key: 'storage', header: 'Storage Used' },
    { key: 'monthlyCost', header: 'Monthly Cost' }
  ];

  const rows = results.scheduleBreakdown.map((item, index) => ({
    id: `row-${index}`,
    schedule: getScheduleTypeName(item.type),
    retention: item.snapshotCount,
    storage: formatStorage(item.storageGB),
    monthlyCost: formatCurrency(item.monthlyCost, pricing.currency)
  }));

  const annualCost = calculateAnnualCost(results.totalMonthlyCost);

  return (
    <Tile className="results-display-tile">
      <Stack gap={6}>
        <h3 className="section-heading">Cost Calculation Results</h3>

        <div className="results-summary">
          <div className="summary-card total-cost-card">
            <div className="summary-label">Total Monthly Cost</div>
            <div className="summary-value total-cost-value">
              {formatCurrency(results.totalMonthlyCost, pricing.currency)}
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-label">Total Annual Cost</div>
            <div className="summary-value">
              {formatCurrency(annualCost, pricing.currency)}
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-label">Total Snapshots</div>
            <div className="summary-value">
              {results.totalSnapshots}
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-label">Total Storage (Snapshots + Base)</div>
            <div className="summary-value">
              {formatStorage(results.totalStorageGB)}
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-label">Base Volume Size</div>
            <div className="summary-value">
              {formatStorage(results.baseVolumeGB)}
            </div>
          </div>
        </div>

        <div className="schedule-breakdown">
          <h4 className="breakdown-heading">Schedule Breakdown</h4>
          <DataTable rows={rows} headers={headers}>
            {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
              <Table {...getTableProps()}>
                <TableHead>
                  <TableRow>
                    {headers.map((header) => (
                      <TableHeader {...getHeaderProps({ header })} key={header.key}>
                        {header.header}
                      </TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow {...getRowProps({ row })} key={row.id}>
                      {row.cells.map((cell) => (
                        <TableCell key={cell.id}>{cell.value}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </DataTable>
        </div>

        <Accordion>
          <AccordionItem title="Calculation Details & Traceability">
            <div className="calculation-details">
              <h4 className="details-heading">Input Parameters</h4>
              <ul className="details-list">
                <li>
                  <strong>Base Volume Size:</strong> {formatStorage(results.baseVolumeGB)}
                </li>
                <li>
                  <strong>Daily Change Rate:</strong> {results.effectiveChangeRate.toFixed(1)}%
                </li>
                <li>
                  <strong>Active Schedules:</strong> {results.scheduleBreakdown.length}
                </li>
                <li>
                  <strong>Price per GB:</strong> {formatCurrency(pricing.pricePerGB, pricing.currency)}/GB/month
                </li>
                <li>
                  <strong>Region:</strong> {pricing.region}
                </li>
              </ul>

              <h4 className="details-heading">Storage Calculation Breakdown</h4>
              {results.scheduleBreakdown.map((schedule, index) => {
                const scheduleType = getScheduleTypeName(schedule.type);
                const snapshotsPerSystem = schedule.retention;
                const totalSystems = results.systemCount;
                
                return (
                  <div key={index} className="schedule-calculation">
                    <h5 className="schedule-calc-title">{scheduleType} Schedule</h5>
                    <ul className="details-list">
                      <li>
                        <strong>Retention per System:</strong> {snapshotsPerSystem} snapshots
                      </li>
                      <li>
                        <strong>Number of Systems:</strong> {totalSystems}
                      </li>
                      <li>
                        <strong>Total Snapshots:</strong> {snapshotsPerSystem} × {totalSystems} = {schedule.snapshotCount} snapshots
                      </li>
                      <li>
                        <strong>Storage per Snapshot:</strong> {results.effectiveChangeRate.toFixed(1)}% × {formatStorage(results.baseVolumeGB)} = {formatStorage(schedule.perSnapshotStorage)}
                      </li>
                      <li>
                        <strong>Total Storage:</strong> {schedule.retention} snapshots × {formatStorage(schedule.perSnapshotStorage)} = {formatStorage(schedule.storageGB)}
                      </li>
                      <li>
                        <strong>Monthly Cost:</strong> {formatStorage(schedule.storageGB)} × {formatCurrency(pricing.pricePerGB, pricing.currency)}/GB = {formatCurrency(schedule.monthlyCost, pricing.currency)}
                      </li>
                    </ul>
                  </div>
                );
              })}

              <h4 className="details-heading">Total Calculation</h4>
              <ul className="details-list">
                <li>
                  <strong>Total Snapshots:</strong> {results.totalSnapshots} across all schedules
                </li>
                <li>
                  <strong>Total Storage:</strong> {formatStorage(results.totalStorageGB)} (includes base volume + all incremental snapshots)
                </li>
                <li>
                  <strong>Total Monthly Cost:</strong> {formatCurrency(results.totalMonthlyCost, pricing.currency)}
                </li>
                <li>
                  <strong>Total Annual Cost:</strong> {formatCurrency(annualCost, pricing.currency)} ({formatCurrency(results.totalMonthlyCost, pricing.currency)} × 12 months)
                </li>
              </ul>
            </div>
          </AccordionItem>
        </Accordion>

        <div className="cost-notes">
          <p className="note-text">
            <strong>Note:</strong> Costs are estimates based on the configured parameters.
            Actual costs may vary based on actual data change patterns and IBM Cloud pricing updates.
          </p>
        </div>
      </Stack>
    </Tile>
  );
}

export default ResultsDisplay;

// Made with Bob

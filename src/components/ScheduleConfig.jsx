import { useState } from 'react';
import { 
  Accordion, 
  AccordionItem, 
  NumberInput, 
  Toggle, 
  Tile, 
  Stack 
} from '@carbon/react';

/**
 * ScheduleConfig Component
 * 
 * Allows users to configure multiple concurrent snapshot schedules:
 * - Hourly, Daily, Weekly, Monthly
 * - Each with customizable retention count
 * - Enable/disable individual schedules
 */
function ScheduleConfig({ schedules, onChange, errors = {} }) {
  const handleScheduleChange = (scheduleId, updates) => {
    const updatedSchedules = schedules.map(schedule =>
      schedule.id === scheduleId
        ? { ...schedule, ...updates }
        : schedule
    );
    onChange(updatedSchedules);
  };

  const getScheduleDescription = (type) => {
    const descriptions = {
      hourly: 'Create snapshots every hour. Ideal for critical data requiring minimal RPO.',
      daily: 'Create snapshots once per day. Standard for most production workloads.',
      weekly: 'Create snapshots once per week. Suitable for less critical data.',
      monthly: 'Create snapshots once per month. Long-term retention for compliance.'
    };
    return descriptions[type];
  };

  const getRetentionHelperText = (type) => {
    const helpers = {
      hourly: 'Number of hourly snapshots to retain (e.g., 24 = last 24 hours)',
      daily: 'Number of daily snapshots to retain (e.g., 7 = last 7 days)',
      weekly: 'Number of weekly snapshots to retain (e.g., 4 = last 4 weeks)',
      monthly: 'Number of monthly snapshots to retain (e.g., 12 = last 12 months)'
    };
    return helpers[type];
  };

  return (
    <Tile className="schedule-config-tile">
      <Stack gap={6}>
        <h3 className="section-heading">Snapshot Schedules</h3>
        <p className="section-description">
          Configure one or more snapshot schedules. Multiple schedules can run
          concurrently to meet different retention requirements.
        </p>

        {errors.global && (
          <div className="error-message" role="alert">
            {errors.global}
          </div>
        )}

        <Accordion>
          {schedules.map((schedule) => (
            <AccordionItem
              key={schedule.id}
              title={
                <div className="schedule-title">
                  <span className="schedule-label">{schedule.label}</span>
                  {schedule.enabled && (
                    <span className="schedule-status-badge">Enabled</span>
                  )}
                </div>
              }
            >
              <Stack gap={5}>
                <Toggle
                  id={`${schedule.id}-toggle`}
                  labelText="Enable this schedule"
                  labelA="Disabled"
                  labelB="Enabled"
                  toggled={schedule.enabled}
                  onToggle={(checked) =>
                    handleScheduleChange(schedule.id, { enabled: checked })
                  }
                />

                <p className="schedule-description">
                  {getScheduleDescription(schedule.type)}
                </p>

                {schedule.enabled && (
                  <NumberInput
                    id={`${schedule.id}-retention`}
                    label="Retention Count"
                    helperText={getRetentionHelperText(schedule.type)}
                    min={1}
                    max={1000}
                    step={1}
                    value={schedule.retention}
                    onChange={(e, { value }) => {
                      if (value !== '') {
                        handleScheduleChange(schedule.id, {
                          retention: Number(value)
                        });
                      }
                    }}
                    invalid={
                      errors[schedule.id] && !!errors[schedule.id].retention
                    }
                    invalidText={
                      errors[schedule.id]?.retention
                    }
                    allowEmpty={false}
                  />
                )}

                {schedule.enabled && (
                  <div className="schedule-summary">
                    <strong>Summary:</strong> Retain {schedule.retention}{' '}
                    {schedule.type} snapshot{schedule.retention !== 1 ? 's' : ''}
                  </div>
                )}
              </Stack>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="schedule-info">
          <strong>Note:</strong> Multiple schedules can be enabled simultaneously.
          Each schedule operates independently and contributes to total storage costs.
        </div>
      </Stack>
    </Tile>
  );
}

export default ScheduleConfig;

// Made with Bob

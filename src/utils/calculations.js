/**
 * Snapshot Storage Calculation Utilities
 * 
 * This module contains the core logic for calculating snapshot storage
 * requirements and costs based on volume size, change rates, and retention policies.
 */

/**
 * Get time factor for converting daily change rate to schedule-specific rate
 * @param {string} scheduleType - Type of schedule (hourly, daily, weekly, monthly)
 * @returns {number} Time factor multiplier
 */
export function getTimeFactor(scheduleType) {
  const factors = {
    hourly: 1 / 24,    // 1 hour = 1/24 of a day
    daily: 1,          // 1 day = 1 day
    weekly: 7,         // 1 week = 7 days
    monthly: 30        // 1 month ≈ 30 days (average)
  };
  
  return factors[scheduleType] || 1;
}

/**
 * Calculate storage required for a specific schedule
 * @param {number} baseVolumeGB - Base volume size in GB (total across all systems)
 * @param {number} dailyChangeRate - Daily change rate (0-1, e.g., 0.20 for 20%)
 * @param {object} schedule - Schedule configuration
 * @param {number} systemCount - Number of systems
 * @returns {object} Storage calculation details
 */
export function calculateScheduleStorage(baseVolumeGB, dailyChangeRate, schedule, systemCount) {
  const { type, retention } = schedule;
  
  // Get time factor for this schedule type
  const timeFactor = getTimeFactor(type);
  
  // Calculate change rate for this schedule period
  const scheduleChangeRate = dailyChangeRate * timeFactor;
  
  // All snapshots are charged at delta rate (incremental)
  // IBM Cloud charges only for changed data, even for the first snapshot
  const totalStorageGB = retention * baseVolumeGB * scheduleChangeRate;
  
  // Total number of snapshots across all systems
  const totalSnapshots = retention * systemCount;
  
  return {
    storageGB: totalStorageGB,
    snapshotCount: totalSnapshots,
    perSnapshotStorage: baseVolumeGB * scheduleChangeRate
  };
}

/**
 * Calculate total snapshot costs across all schedules
 * @param {object} config - Configuration object
 * @returns {object} Calculation results
 */
export function calculateSnapshotCosts(config) {
  const { volume, changeRate, schedules, pricing } = config;
  
  // Calculate base volume per system
  const baseVolumeGB = volume.systemCount * volume.volumeSize;
  
  // Get daily change rate (as decimal, e.g., 0.20 for 20%)
  const dailyChangeRate = changeRate.dailyRate;
  
  // Calculate storage and cost for each enabled schedule
  const scheduleBreakdown = schedules
    .filter(schedule => schedule.enabled)
    .map(schedule => {
      const calculation = calculateScheduleStorage(
        baseVolumeGB,
        dailyChangeRate,
        schedule,
        volume.systemCount
      );
      
      const monthlyCost = calculation.storageGB * pricing.pricePerGB;
      
      return {
        scheduleId: schedule.id,
        type: schedule.type,
        retention: schedule.retention,
        snapshotCount: calculation.snapshotCount,
        storageGB: Math.round(calculation.storageGB * 100) / 100,
        perSnapshotStorage: Math.round(calculation.perSnapshotStorage * 100) / 100,
        monthlyCost: Math.round(monthlyCost * 100) / 100
      };
    });
  
  // Calculate totals
  const totalStorageGB = scheduleBreakdown.reduce(
    (sum, item) => sum + item.storageGB,
    0
  );
  
  const totalMonthlyCost = scheduleBreakdown.reduce(
    (sum, item) => sum + item.monthlyCost,
    0
  );
  
  const totalSnapshots = scheduleBreakdown.reduce(
    (sum, item) => sum + item.snapshotCount,
    0
  );
  
  return {
    scheduleBreakdown,
    totalStorageGB: Math.round(totalStorageGB * 100) / 100,
    totalMonthlyCost: Math.round(totalMonthlyCost * 100) / 100,
    totalSnapshots,
    baseVolumeGB,
    systemCount: volume.systemCount,
    dailyChangeRate,
    effectiveChangeRate: dailyChangeRate * 100 // As percentage
  };
}

/**
 * Get daily change rate from preset or custom value
 * @param {object} changeRateConfig - Change rate configuration
 * @returns {number} Daily change rate (0-1)
 */
export function getDailyChangeRate(changeRateConfig) {
  const { preset, customValue } = changeRateConfig;
  
  const presets = {
    low: 0.05,      // 5% daily change
    medium: 0.20,   // 20% daily change
    high: 0.40      // 40% daily change
  };
  
  if (preset === 'custom') {
    // Convert percentage to decimal (e.g., 25 -> 0.25)
    return Math.max(0, Math.min(1, customValue / 100));
  }
  
  return presets[preset] || presets.medium;
}

/**
 * Validate volume configuration
 * @param {object} volume - Volume configuration
 * @returns {object} Validation result with errors
 */
export function validateVolume(volume) {
  const errors = {};
  
  if (!volume.systemCount || volume.systemCount < 1) {
    errors.systemCount = 'At least 1 system is required';
  } else if (volume.systemCount > 10000) {
    errors.systemCount = 'Maximum 10,000 systems allowed';
  } else if (!Number.isInteger(volume.systemCount)) {
    errors.systemCount = 'System count must be a whole number';
  }
  
  if (!volume.volumeSize || volume.volumeSize < 1) {
    errors.volumeSize = 'Volume size must be at least 1 GB';
  } else if (volume.volumeSize > 100000) {
    errors.volumeSize = 'Maximum volume size is 100,000 GB';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate change rate configuration
 * @param {object} changeRate - Change rate configuration
 * @returns {object} Validation result with errors
 */
export function validateChangeRate(changeRate) {
  const errors = {};
  
  if (changeRate.preset === 'custom') {
    if (changeRate.customValue < 0) {
      errors.customValue = 'Change rate cannot be negative';
    } else if (changeRate.customValue > 100) {
      errors.customValue = 'Change rate cannot exceed 100%';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate schedule configuration
 * @param {object} schedule - Schedule configuration
 * @returns {object} Validation result with errors
 */
export function validateSchedule(schedule) {
  const errors = {};
  
  if (!schedule.retention || schedule.retention < 1) {
    errors.retention = 'At least 1 snapshot must be retained';
  } else if (schedule.retention > 1000) {
    errors.retention = 'Maximum 1,000 snapshots allowed';
  } else if (!Number.isInteger(schedule.retention)) {
    errors.retention = 'Retention count must be a whole number';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate all schedules
 * @param {array} schedules - Array of schedule configurations
 * @returns {object} Validation result with errors
 */
export function validateSchedules(schedules) {
  const errors = {};
  let hasEnabledSchedule = false;
  
  schedules.forEach(schedule => {
    if (schedule.enabled) {
      hasEnabledSchedule = true;
      const validation = validateSchedule(schedule);
      if (!validation.isValid) {
        errors[schedule.id] = validation.errors;
      }
    }
  });
  
  if (!hasEnabledSchedule) {
    errors.global = 'At least one schedule must be enabled';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Get default schedule configurations
 * @returns {array} Array of default schedule objects
 */
export function getDefaultSchedules() {
  return [
    {
      id: 'schedule-hourly',
      type: 'hourly',
      enabled: false,
      retention: 24,
      label: 'Hourly Snapshots'
    },
    {
      id: 'schedule-daily',
      type: 'daily',
      enabled: true,
      retention: 7,
      label: 'Daily Snapshots'
    },
    {
      id: 'schedule-weekly',
      type: 'weekly',
      enabled: false,
      retention: 4,
      label: 'Weekly Snapshots'
    },
    {
      id: 'schedule-monthly',
      type: 'monthly',
      enabled: false,
      retention: 12,
      label: 'Monthly Snapshots'
    }
  ];
}

/**
 * Get schedule type display name
 * @param {string} type - Schedule type
 * @returns {string} Display name
 */
export function getScheduleTypeName(type) {
  const names = {
    hourly: 'Hourly',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly'
  };
  
  return names[type] || type;
}

/**
 * Calculate estimated annual cost
 * @param {number} monthlyCost - Monthly cost
 * @returns {number} Annual cost
 */
export function calculateAnnualCost(monthlyCost) {
  return Math.round(monthlyCost * 12 * 100) / 100;
}

// Made with Bob

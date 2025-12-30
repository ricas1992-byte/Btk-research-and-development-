// ============================================
// Application Configuration
// ============================================

export const CONFIG = {
  // Session and authentication
  SESSION_EXPIRY_DAYS: 30,

  // Auto-save
  AUTO_SAVE_INTERVAL_MS: 30000, // 30 seconds

  // Session timer
  LONG_SESSION_REMINDER_MS: 5400000, // 90 minutes

  // Content limits
  NOTE_MAX_LENGTH: 300,

  // API timeouts
  CLAUDE_TIMEOUT_MS: 30000, // 30 seconds
  DATA_TIMEOUT_MS: 15000, // 15 seconds

  // Network retry
  NETWORK_RETRY_INTERVAL_MS: 10000, // 10 seconds

  // Single user username (canonical - per FULL EXECUTION BRIEF)
  DEFAULT_USERNAME: 'yotam_ricas',
} as const;

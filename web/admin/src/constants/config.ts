// Application configuration constants

// Default tenant ID for development
// TODO: In production, this should be extracted from user authentication
export const DEFAULT_TENANT_ID = 'tenant_1';

// Application settings
export const APP_CONFIG = {
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  
  // Session timeout (in milliseconds)
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  
  // API timeout (in milliseconds)
  API_TIMEOUT: 30 * 1000, // 30 seconds
  
  // Default working hours
  DEFAULT_WORKING_HOURS: [
    { dayOfWeek: 1, openTime: '09:00', closeTime: '17:00' }, // Monday
    { dayOfWeek: 2, openTime: '09:00', closeTime: '17:00' }, // Tuesday
    { dayOfWeek: 3, openTime: '09:00', closeTime: '17:00' }, // Wednesday
    { dayOfWeek: 4, openTime: '09:00', closeTime: '17:00' }, // Thursday
    { dayOfWeek: 5, openTime: '09:00', closeTime: '17:00' }, // Friday
  ]
} as const;
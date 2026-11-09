export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
  enableDevLogin: import.meta.env.VITE_ENABLE_DEV_LOGIN === 'true',
} as const;

export const PLAUSIBLE_ORIGIN = 'https://plausible.io';
export const GOOGLE_TAG_MANAGER_ORIGIN = 'https://www.googletagmanager.com';

// Google's documented GA4 sources: hits go to regional *.google-analytics.com and *.analytics.google.com hosts.
const GOOGLE_TAG_MANAGER_HOSTS = 'https://*.googletagmanager.com';
const GOOGLE_ANALYTICS_HOSTS = 'https://*.google-analytics.com';

export const GOOGLE_ANALYTICS_SCRIPT_SOURCES = [
  GOOGLE_TAG_MANAGER_HOSTS,
] as const;
export const GOOGLE_ANALYTICS_IMG_SOURCES = [
  GOOGLE_ANALYTICS_HOSTS,
  GOOGLE_TAG_MANAGER_HOSTS,
] as const;
export const GOOGLE_ANALYTICS_CONNECT_SOURCES = [
  GOOGLE_ANALYTICS_HOSTS,
  'https://*.analytics.google.com',
  GOOGLE_TAG_MANAGER_HOSTS,
] as const;

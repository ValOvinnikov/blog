import { env } from '@web/utils/env/env';

export const isWebAnalyticsEnabled = (): boolean => {
  return env.WEB_ANALYTICS_ENABLED === 'true';
};

import { env } from '@web/utils/env/env';

/**
 * The one discriminator for "should `<Analytics />`/`<SpeedInsights />`
 * render at all?" (`apps/web/src/app/layout.tsx`) — see
 * `VERCEL_ANALYTICS_ENABLED`'s own comment in `@web/utils/env/env` for why
 * this has to be an explicit opt-in rather than a `VERCEL_ENV` check.
 *
 * @example
 * isVercelAnalyticsEnabled() // true only when VERCEL_ANALYTICS_ENABLED === 'true'
 */
export function isVercelAnalyticsEnabled(): boolean {
  return env.VERCEL_ANALYTICS_ENABLED === 'true';
}

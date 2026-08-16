import { env } from '@web/utils/env/env';

/**
 * The one discriminator for "should `<Analytics />`/`<SpeedInsights />`
 * render at all?" (`apps/web/src/app/layout.tsx`) — see
 * `WEB_ANALYTICS_ENABLED`'s own comment in `@web/utils/env/env` for why
 * this has to be an explicit opt-in rather than a `VERCEL_ENV` check.
 *
 * @example
 * isWebAnalyticsEnabled() // true only when WEB_ANALYTICS_ENABLED === 'true'
 */
export function isWebAnalyticsEnabled(): boolean {
  return env.WEB_ANALYTICS_ENABLED === 'true';
}

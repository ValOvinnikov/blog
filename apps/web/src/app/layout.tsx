import '../../index.css';

import { CAPABILITY, LOCALE_ISO_CODES } from '@blog/config';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { resolveFontVariableClassName } from '@web/config/fonts';
import { themeBootstrapScript } from '@web/config/theme-script';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled';
import { buildThemeStyleBlock } from '@web/utils/build-theme-style-block';
import { getThemeTokens } from '@web/utils/get-theme-tokens';
import { isWebAnalyticsEnabled } from '@web/utils/is-web-analytics-enabled';

type TProps = {
  children: React.ReactNode;
};

// Fixed public hostname for every Sanity project's asset CDN (not per-tenant),
// so it's safe to hardcode, like next.config.ts's CSP/remotePatterns entries.
// No `crossOrigin`: the logo, avatar, and hero image load as plain (non-CORS)
// requests, and an anonymous preconnect would open a connection they can't reuse.
const SANITY_IMAGE_CDN_ORIGIN = 'https://cdn.sanity.io';

/**
 * The real root layout — `[locale]/layout.tsx` is the de facto root for
 * every localized route (this app has one locale, hidden from the URL by
 * `localePrefix: 'never'`), but Next.js still requires a genuine
 * `app/layout.tsx` to own the document shell so that root-level files like
 * `not-found.tsx` have a layout to render into. `lang` is fixed rather than
 * threaded from `params` — this app has exactly one locale today
 * (`routing.ts`) and a root layout has no route params to read one from.
 *
 * Resolves the tenant's theme tokens here to inject the `<style>` block and
 * pick the `next/font` variable classes at server-render time. A fetch
 * failure falls back to the Console preset's own tokens rather than
 * `notFound()`: this shell wraps the whole app, including the not-found page
 * itself, so it must always render.
 */
export default async function RootLayout({ children }: TProps) {
  const [themeTokens, isAnalyticsCapabilityEnabled] = await Promise.all([
    getThemeTokens(),
    isCapabilityEnabled(CAPABILITY.ANALYTICS),
  ]);

  const analyticsEnabled =
    isWebAnalyticsEnabled() && isAnalyticsCapabilityEnabled;
  const fontVariableClassName = resolveFontVariableClassName(
    themeTokens.headingFont,
    themeTokens.bodyFont,
  );

  return (
    <html
      lang={LOCALE_ISO_CODES.EN.toLowerCase()}
      className={fontVariableClassName}
      suppressHydrationWarning={true}
    >
      <head>
        <link rel="preconnect" href={SANITY_IMAGE_CDN_ORIGIN} />
        <style
          dangerouslySetInnerHTML={{
            __html: buildThemeStyleBlock(themeTokens),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: themeBootstrapScript,
          }}
        />
      </head>
      <body>
        {children}
        {/* Both scripts 404 on a project without Speed Insights/Web
            Analytics enabled in the Vercel dashboard, so `isWebAnalyticsEnabled()`
            must gate them alongside the tenant's `ANALYTICS` capability. */}
        {analyticsEnabled && <SpeedInsights />}
        {analyticsEnabled && <Analytics />}
      </body>
    </html>
  );
}

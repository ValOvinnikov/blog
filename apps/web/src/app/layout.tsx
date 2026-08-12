import '../../index.css';

import { LOCALE_ISO_CODES, PRESET_ID, PRESET_REGISTRY } from '@blog/config';
import { service } from '@blog/service';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { resolveFontVariableClassName } from '@web/config/fonts';
import { themeBootstrapScript } from '@web/config/theme-script';
import { buildThemeStyleBlock } from '@web/utils/build-theme-style-block';
import { isVercelAnalyticsEnabled } from '@web/utils/is-vercel-analytics-enabled';

type TProps = {
  children: React.ReactNode;
};

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
  const result = await service.global.themeSettings.v1.getTheme();

  if (!result.ok) {
    console.error(`Error to fetch theme settings: ${result.error}`);
  }

  const themeTokens = result.ok
    ? result.data
    : PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens;

  const analyticsEnabled = isVercelAnalyticsEnabled();

  return (
    <html
      lang={LOCALE_ISO_CODES.EN.toLowerCase()}
      className={resolveFontVariableClassName(
        themeTokens.headingFont,
        themeTokens.bodyFont,
      )}
      suppressHydrationWarning={true}
    >
      <head>
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
        {/* Client components (use hooks internally) mounted at the leaf —
            collect real-user Core Web Vitals and pageview analytics. Both
            unconditionally request a same-origin script
            (`/_vercel/speed-insights/script.js` / `/_vercel/insights/script.js`)
            that Vercel's edge only proxies when the matching dashboard
            feature is enabled for the deploying project — gated behind
            `isVercelAnalyticsEnabled()` (env var, not `VERCEL_ENV`; see its
            own comment) so a project without Speed Insights/Web Analytics
            turned on doesn't 404 on that path (issue #1072). */}
        {analyticsEnabled && <SpeedInsights />}
        {analyticsEnabled && <Analytics />}
      </body>
    </html>
  );
}

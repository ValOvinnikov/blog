import '../../index.css';

import { LOCALE_ISO_CODES } from '@blog/config';
import { themeBootstrapScript } from '@web/config/theme-script';

type TProps = {
  children: React.ReactNode;
};

// Fixed public hostname for every Sanity project's asset CDN (not per-tenant),
// so it's safe to hardcode, like next.config.ts's CSP/remotePatterns entries.
// No `crossOrigin`: the logo, avatar, and hero image load as plain (non-CORS)
// requests, and an anonymous preconnect would open a connection they can't reuse.
const SANITY_IMAGE_CDN_ORIGIN = 'https://cdn.sanity.io';

/**
 * The real root layout — `[tenant]/[locale]/layout.tsx` is the de facto root
 * for every localized route (this app has one locale, hidden from the URL
 * by `localePrefix: 'never'`, and the tenant segment is hidden the same way
 * by `proxy.ts`'s rewrite), but Next.js still requires a genuine
 * `app/layout.tsx` to own the document shell so that root-level files like
 * `not-found.tsx` have a layout to render into. `lang` is fixed rather than
 * threaded from `params` — this app has exactly one locale today
 * (`routing.ts`) and a root layout has no route params to read one from.
 *
 * Tenant-independent by design: it sits above where the tenant is resolved,
 * so it owns only the static document shell. Theme tokens, font variables,
 * and analytics gating live in `[tenant]/[locale]/layout.tsx`; `not-found.tsx`
 * — the one route that renders outside that layout — resolves its own.
 */
export default function RootLayout({ children }: TProps) {
  return (
    <html
      lang={LOCALE_ISO_CODES.EN.toLowerCase()}
      suppressHydrationWarning={true}
    >
      <head>
        <link rel="preconnect" href={SANITY_IMAGE_CDN_ORIGIN} />
        <script
          dangerouslySetInnerHTML={{
            __html: themeBootstrapScript,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

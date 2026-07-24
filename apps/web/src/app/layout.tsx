import '../../index.css';

import { LOCALE_ISO_CODES, type TBrandVariants } from '@blog/config';
import { service } from '@blog/service';
import { jetbrainsMono, newsreader, spaceGrotesk } from '@web/config/fonts';
import { themeBootstrapScript } from '@web/config/theme-script';
import { buildRootHtmlClassName } from '@web/utils/root-html-class-name';

const FONT_VARIABLE_CLASS_NAMES = `${spaceGrotesk.variable} ${newsreader.variable} ${jetbrainsMono.variable}`;

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
 * Fetches site settings again here (`[locale]/layout.tsx` and its
 * `generateMetadata` both fetch the same tagged query in the same request)
 * purely to read the CMS-driven
 * brand variant onto `<html>` at server-render time — Next dedupes the
 * identical `getSiteSettings()` call via the data cache, so this costs no
 * extra network round trip. A fetch failure falls back to the Console
 * default rather than `notFound()`: this shell wraps the whole app,
 * including the not-found page itself, so it must always render.
 */
export default async function RootLayout({ children }: TProps) {
  const result = await service.global.siteSettings.v1.getSiteSettings();

  let variant: TBrandVariants | undefined;
  if (result.ok) {
    variant = result.data.brand.variant;
  } else {
    console.error(`Error to fetch site settings: ${result.error}`);
  }

  return (
    <html
      lang={LOCALE_ISO_CODES.EN.toLowerCase()}
      className={buildRootHtmlClassName(FONT_VARIABLE_CLASS_NAMES, variant)}
      suppressHydrationWarning
    >
      <head>
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

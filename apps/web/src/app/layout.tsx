import '../../index.css';

import { LOCALE_ISO_CODES } from '@blog/config';
import { jetbrainsMono, newsreader, spaceGrotesk } from '@web/config/fonts';
import { themeBootstrapScript } from '@web/config/theme-script';

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
 */
export default function RootLayout({ children }: TProps) {
  return (
    <html
      lang={LOCALE_ISO_CODES.EN}
      className={`${spaceGrotesk.variable} ${newsreader.variable} ${jetbrainsMono.variable}`}
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

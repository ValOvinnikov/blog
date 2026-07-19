// This app's root layout lives at `[locale]/layout.tsx` — a top-level
// dynamic segment — so there's no single `app/layout.tsx` to compose a
// global 404 from. Next.js's documented fix for exactly this topology is
// the `global-not-found.js` file convention (opted into below via
// `experimental.globalNotFound` in `next.config.ts`): unlike `not-found.tsx`,
// it bypasses normal layout composition entirely and must be a fully
// self-contained document — own `<html>`/`<body>`, own global stylesheet +
// font imports, own dark-mode bootstrap script.
import '../../index.css';

import { NotFoundPage } from '@web/components/not-found-page/not-found-page';
import { jetbrainsMono, newsreader, spaceGrotesk } from '@web/config/fonts';
import { themeBootstrapScript } from '@web/config/theme-script';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page not found',
  description: 'The page you are looking for does not exist.',
};

export default function GlobalNotFound() {
  return (
    <html
      lang="en"
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
      <body>
        <NotFoundPage />
      </body>
    </html>
  );
}

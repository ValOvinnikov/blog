import '../../index.css';

import { LOCALE_ISO_CODES } from '@blog/config';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pageMetadata');
  return { title: t('root') };
}

type TProps = {
  children: React.ReactNode;
};

/**
 * The real root layout — `[locale]/layout.tsx` is the de facto root for
 * every localized route (this app has one locale, hidden from the URL by
 * `localePrefix: 'never'`), but Next.js still requires a genuine
 * `app/layout.tsx` to own the document shell. `lang` is fixed rather than
 * threaded from `params` — a root layout has no route params to read one
 * from.
 */
export default function RootLayout({ children }: TProps) {
  return (
    <html lang={LOCALE_ISO_CODES.EN.toLowerCase()}>
      <body>{children}</body>
    </html>
  );
}

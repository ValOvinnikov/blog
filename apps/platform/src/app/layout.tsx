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

// `lang` is fixed: a root layout has no `[locale]` param to read it from.
export default function RootLayout({ children }: TProps) {
  return (
    <html lang={LOCALE_ISO_CODES.EN.toLowerCase()}>
      <body>{children}</body>
    </html>
  );
}

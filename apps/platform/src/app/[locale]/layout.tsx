import '../../../index.css';

import { LOCALE_BCP47_TAGS } from '@blog/config';
import { inter } from '@platform/config/font-loaders/inter-font';
import { ToastProvider } from '@platform/context/toast-provider';
import { UnsavedChangesProvider } from '@platform/context/unsaved-changes-provider';
import { routing } from '@platform/i18n/routing';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';

type TProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export const viewport: Viewport = { viewportFit: 'cover' };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    ...(await pageMetadata('root')),
    robots: { index: false, follow: false },
  };
}

export default async function LocaleLayout({ children, params }: TProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={LOCALE_BCP47_TAGS[locale]}>
      <body className={`${inter.variable} font-admin text-admin-14`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ToastProvider>
            <UnsavedChangesProvider>{children}</UnsavedChangesProvider>
          </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

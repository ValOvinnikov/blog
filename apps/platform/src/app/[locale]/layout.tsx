import '../../../index.css';

import { LOCALE_BCP47_TAGS } from '@blog/config';
import { inter } from '@platform/config/font-loaders/inter-font';
import { ToastProvider } from '@platform/context/toast-provider';
import { UnsavedChangesProvider } from '@platform/context/unsaved-changes-provider';
import { routing } from '@platform/i18n/routing';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from 'next-intl/server';

type TProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pageMetadata');
  return { title: t('root') };
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
      <body className={`${inter.variable} font-admin text-[14px]`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ToastProvider>
            <UnsavedChangesProvider>{children}</UnsavedChangesProvider>
          </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

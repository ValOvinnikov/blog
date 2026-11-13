import '../../../index.css';

import { LOCALE_BCP47_TAGS } from '@blog/config';
import { OutOfDatePageDialog } from '@platform/components/features/layout/out-of-date-page-dialog';
import { inter } from '@platform/config/font-loaders/inter-font';
import { jetbrainsMono } from '@platform/config/font-loaders/jetbrains-mono-font';
import { DATA_THEME } from '@platform/constants/theme';
import { ToastProvider } from '@platform/context/toast-provider';
import { UnsavedChangesProvider } from '@platform/context/unsaved-changes-provider';
import { routing } from '@platform/i18n/routing';
import { resolveThemeColorScheme } from '@platform/server/layout/resolve-theme-color-scheme';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';

type TProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

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

  const [messages, colorScheme] = await Promise.all([
    getMessages(),
    resolveThemeColorScheme(),
  ]);

  return (
    <html
      lang={LOCALE_BCP47_TAGS[locale]}
      data-theme={colorScheme && DATA_THEME[colorScheme]}
    >
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-admin text-admin-14`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ToastProvider>
            <UnsavedChangesProvider>{children}</UnsavedChangesProvider>
            <OutOfDatePageDialog />
          </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

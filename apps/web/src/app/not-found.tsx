import { LOCALE_ISO_CODES } from '@blog/config';
import { NotFoundPage } from '@web/components/pages/not-found-page';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from 'next-intl/server';

/**
 * This root boundary sits outside `[locale]/layout.tsx` (see `app/layout.tsx`'s
 * doc comment), so it gets no request locale and no `NextIntlClientProvider`
 * for free. `setRequestLocale` must run before any other next-intl API, or
 * that API falls back to reading `headers()` — fatal ("Page changed from
 * static to dynamic at runtime") on an on-demand render of the otherwise-
 * static `[locale]/[slug]` route. The provider wraps `NotFoundPage` because
 * its `SmartLink` renders next-intl's client `Link`, which throws without
 * one.
 */
export async function generateMetadata(): Promise<Metadata> {
  setRequestLocale(LOCALE_ISO_CODES.EN);
  const t = await getTranslations('notFound');

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default async function NotFound() {
  setRequestLocale(LOCALE_ISO_CODES.EN);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={LOCALE_ISO_CODES.EN} messages={messages}>
      <NotFoundPage />
    </NextIntlClientProvider>
  );
}

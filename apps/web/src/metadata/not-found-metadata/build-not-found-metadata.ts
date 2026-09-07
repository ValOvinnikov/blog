import { LOCALE_ISO_CODES } from '@blog/config';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

/**
 * Metadata shared by every `not-found.tsx` boundary outside
 * `[tenant]/[locale]/layout.tsx` — the root `app/not-found.tsx` and
 * `app/[tenant]/not-found.tsx`. Neither receives route params, so the
 * locale is fixed rather than threaded through.
 */
export const buildNotFoundMetadata = async (): Promise<Metadata> => {
  setRequestLocale(LOCALE_ISO_CODES.EN);
  const t = await getTranslations('notFound');

  return {
    title: t('heading'),
    description: t('supportingText'),
  };
};

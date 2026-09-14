import { LOCALE_ISO_CODES } from '@blog/config';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

/**
 * Metadata shared by every `not-found.tsx` boundary in the app — none
 * receives route params, so the locale is fixed rather than threaded
 * through (this app has exactly one).
 */
export const buildNotFoundMetadata = async (): Promise<Metadata> => {
  setRequestLocale(LOCALE_ISO_CODES.EN);
  const t = await getTranslations('notFound');

  return {
    title: t('heading'),
    description: t('supportingText'),
  };
};

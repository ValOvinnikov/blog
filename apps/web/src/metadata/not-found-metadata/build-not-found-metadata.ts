import { LOCALE_ISO_CODES } from '@blog/config';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

// Not-found boundaries receive no route params, so their locale is fixed.
export const buildNotFoundMetadata = async (): Promise<Metadata> => {
  setRequestLocale(LOCALE_ISO_CODES.EN);
  const t = await getTranslations('notFound');

  return {
    title: t('heading'),
    description: t('supportingText'),
  };
};

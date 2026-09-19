import { routes } from '@blog/config';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export const buildAccountMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations('accountPage');

  return {
    title: t('title'),
    description: t('metaDescription'),
    alternates: { canonical: routes.account() },
    robots: { index: false, follow: false },
  };
};

import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export const buildNewsletterUnsubscribeMetadata =
  async (): Promise<Metadata> => {
    const t = await getTranslations('newsletterUnsubscribe');

    return {
      title: t('confirmTitle'),
      robots: { index: false, follow: false },
    };
  };

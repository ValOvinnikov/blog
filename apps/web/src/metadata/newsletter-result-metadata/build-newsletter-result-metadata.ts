import type { TNewsletterResult } from '@blog/config';
import { NEWSLETTER_RESULT_MESSAGES } from '@web/utils/newsletter-result-messages';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export const buildNewsletterResultMetadata = async (
  result: TNewsletterResult,
): Promise<Metadata> => {
  const { namespace, title } = NEWSLETTER_RESULT_MESSAGES[result];
  const t = await getTranslations(namespace);

  return {
    title: t(title),
    robots: { index: false, follow: false },
  };
};

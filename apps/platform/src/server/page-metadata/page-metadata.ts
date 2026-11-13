import 'server-only';

import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export const pageMetadata = async (titleKey: string): Promise<Metadata> => {
  const t = await getTranslations('pageMetadata');
  return { title: t(titleKey) };
};

export const rootPageMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations('pageMetadata');
  return { title: { default: t('root'), template: t('titleTemplate') } };
};

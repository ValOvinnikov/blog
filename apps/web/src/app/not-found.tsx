import { NotFoundPage } from '@web/components/pages/not-found-page';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('notFound');

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default function NotFound() {
  return <NotFoundPage />;
}

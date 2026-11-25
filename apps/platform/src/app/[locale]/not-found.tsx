import { HomeDeadEnd } from '@platform/components/features/layout/home-dead-end';
import { getTranslations } from 'next-intl/server';

export default async function NotFound() {
  const t = await getTranslations('notFoundPage');

  return (
    <HomeDeadEnd
      badge={t('badge')}
      title={t('heading')}
      description={t('description')}
    />
  );
}

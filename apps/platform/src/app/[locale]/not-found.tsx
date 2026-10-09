import { DeadEndView } from '@platform/components/features/layout/dead-end-view';
import { LinkButton } from '@platform/components/shared/link-button';
import { resolveHomeHref } from '@platform/server/auth/resolve-home-href';
import { getTranslations } from 'next-intl/server';

export default async function NotFound() {
  const [t, homeHref] = await Promise.all([
    getTranslations('notFoundPage'),
    resolveHomeHref(),
  ]);

  return (
    <DeadEndView
      title={t('heading')}
      description={t('description')}
      action={
        <LinkButton href={homeHref} variant="secondary">
          {t('backLink')}
        </LinkButton>
      }
    />
  );
}

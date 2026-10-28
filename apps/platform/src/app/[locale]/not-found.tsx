import { DeadEndView } from '@platform/components/features/layout/dead-end-view';
import { LinkButton } from '@platform/components/shared/link-button';
import { getSessionEmail } from '@platform/server/auth/get-session-email';
import { resolveHomeHref } from '@platform/server/auth/resolve-home-href';
import { getTranslations } from 'next-intl/server';

export default async function NotFound() {
  const [t, homeHref, accountEmail] = await Promise.all([
    getTranslations('notFoundPage'),
    resolveHomeHref(),
    getSessionEmail(),
  ]);

  return (
    <DeadEndView
      badge={{ label: t('badge'), tone: 'brand' }}
      title={t('heading')}
      description={t('description')}
      action={
        <LinkButton href={homeHref} variant="secondary">
          {t('backLink')}
        </LinkButton>
      }
      accountEmail={accountEmail}
    />
  );
}

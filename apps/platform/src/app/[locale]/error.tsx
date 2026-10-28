'use client';

import { DeadEndView } from '@platform/components/features/layout/dead-end-view';
import { Button } from '@platform/components/shared/button';
import { LinkButton } from '@platform/components/shared/link-button';
import { adminRoutes } from '@platform/utils/routes/routes';
import { useTranslations } from 'next-intl';

type TProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

export default function ErrorPage({ error, retry }: TProps) {
  const t = useTranslations('errorPage');

  return (
    <DeadEndView
      badge={{ label: t('badge'), tone: 'bad' }}
      title={t('heading')}
      description={t('description')}
      errorId={error.digest}
      action={
        <>
          <Button variant="secondary" onClick={() => retry()}>
            {t('retry')}
          </Button>
          <LinkButton href={adminRoutes.home()} variant="secondary">
            {t('homeLink')}
          </LinkButton>
        </>
      }
    />
  );
}

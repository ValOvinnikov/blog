'use client';

import { DeadEndView } from '@platform/components/features/layout/dead-end-view';
import { Button } from '@platform/components/shared/button';
import { useTranslations } from 'next-intl';

type TProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

export default function ErrorPage({ retry }: TProps) {
  const t = useTranslations('errorPage');

  return (
    <DeadEndView
      title={t('heading')}
      description={t('description')}
      action={
        <Button variant="secondary" onClick={() => retry()}>
          {t('retry')}
        </Button>
      }
    />
  );
}

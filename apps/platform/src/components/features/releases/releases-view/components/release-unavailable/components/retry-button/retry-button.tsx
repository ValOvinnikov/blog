'use client';

import { SIZE } from '@blog/config';
import { Button } from '@platform/components/shared/button';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

export const RetryButton = () => {
  const t = useTranslations('releaseUnavailable');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="secondary"
      size={SIZE.SM}
      isPending={isPending}
      pendingLabel={t('retrying')}
      onClick={() => startTransition(() => router.refresh())}
    >
      {t('retry')}
    </Button>
  );
};

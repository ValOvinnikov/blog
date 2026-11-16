'use client';

import { Button } from '@platform/components/shared/button';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { SIZE } from '@shinefold/config';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

export const RetryButton = () => {
  const t = useTranslations('releaseUnavailable');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant={BUTTON_VARIANT.SECONDARY}
      size={SIZE.SM}
      isPending={isPending}
      pendingLabel={t('retrying')}
      onClick={() => startTransition(() => router.refresh())}
    >
      {t('retry')}
    </Button>
  );
};

'use client';

import { Button } from '@platform/components/shared/button';
import { signOutAction } from '@platform/server/auth/sign-out-action';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

export const SignOutButton = () => {
  const t = useTranslations('account');
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(() => signOutAction());
  };

  return (
    <Button variant="secondary" isPending={isPending} onClick={handleClick}>
      {t('signOut')}
    </Button>
  );
};

'use client';

import type { IWithClassName } from '@blog/config/types';
import { Button } from '@platform/components/shared/button';
import type { TButtonVariants } from '@platform/components/shared/button/button-variants';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { signOutAction } from '@platform/server/auth/sign-out-action';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

export type TSignOutButtonProps = IWithClassName & {
  variant?: TButtonVariants['variant'];
  size?: TButtonVariants['size'];
};

export const SignOutButton = ({
  variant = BUTTON_VARIANT.SECONDARY,
  size,
  className,
}: TSignOutButtonProps) => {
  const t = useTranslations('account');
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(() => signOutAction());
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      isPending={isPending}
      onClick={handleClick}
    >
      {t('signOut')}
    </Button>
  );
};

import { IconButton } from '@blog/ui/components/atoms/icon-button';
import { authMenuVariants } from '@web/components/shared/auth-menu/auth-menu-variants';
import { SignInLabel } from '@web/components/shared/auth-menu/components/sign-in-label/sign-in-label';
import { headerControlVariants } from '@web/components/shared/header-control';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

export interface IAccountSlotProps {
  isPlaceholder?: boolean;
  children: ReactNode;
}

/** Holds the header's account control at the Sign in trigger's width, the widest state, so resolving the session never shifts the bar. */
export const AccountSlot = ({
  isPlaceholder = false,
  children,
}: IAccountSlotProps) => {
  const t = useTranslations('authMenu');
  const { slot, footprint, signInTrigger } = authMenuVariants({
    isPlaceholder,
  });

  return (
    <span className={slot()}>
      <span aria-hidden="true">
        <IconButton
          variant="bordered"
          ariaLabel={t('signIn')}
          isInert={true}
          className={headerControlVariants({
            class: [signInTrigger(), footprint()],
          })}
        >
          <SignInLabel />
        </IconButton>
      </span>
      {children}
    </span>
  );
};

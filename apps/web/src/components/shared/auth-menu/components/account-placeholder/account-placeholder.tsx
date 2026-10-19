import { IconButton } from '@blog/ui/components/atoms/icon-button';
import { authMenuVariants } from '@web/components/shared/auth-menu/auth-menu-variants';
import { SignInLabel } from '@web/components/shared/auth-menu/components/sign-in-label/sign-in-label';
import { headerControlVariants } from '@web/components/shared/header-control';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

export interface IAccountPlaceholderProps {
  children: ReactNode;
}

/** Holds the header's account slot at the width of the reader's last known sign-in state until the session resolves. */
export const AccountPlaceholder = ({ children }: IAccountPlaceholderProps) => {
  const t = useTranslations('authMenu');
  const {
    slot,
    signedOutFootprint,
    signedInFootprint,
    emptyOutline,
    signInTrigger,
  } = authMenuVariants();

  return (
    <span className={slot()}>
      <span aria-hidden="true" className={signedOutFootprint()}>
        <IconButton
          variant="bordered"
          ariaLabel={t('signIn')}
          isInert={true}
          className={headerControlVariants({
            class: [signInTrigger(), emptyOutline()],
          })}
        >
          <SignInLabel />
        </IconButton>
      </span>
      <span aria-hidden="true" className={signedInFootprint()}>
        <span className={headerControlVariants({ shape: 'square' })} />
      </span>
      {children}
    </span>
  );
};

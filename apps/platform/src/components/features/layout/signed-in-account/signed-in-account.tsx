import { SignOutButton } from '@platform/components/features/layout/sign-out-button';
import { useTranslations } from 'next-intl';

import {
  SIGN_OUT_BUTTON_BY_SURFACE,
  signedInAccountVariants,
} from './signed-in-account-variants';

export type TSignedInAccountProps = {
  email: string;
  surface?: keyof typeof SIGN_OUT_BUTTON_BY_SURFACE;
};

export const SignedInAccount = ({
  email,
  surface = 'card',
}: TSignedInAccountProps) => {
  const t = useTranslations('account');
  const {
    root,
    email: emailSlot,
    signOut,
  } = signedInAccountVariants({ surface });

  return (
    <div className={root()}>
      <p className={emailSlot()}>{t('signedInAs', { email })}</p>
      <SignOutButton
        {...SIGN_OUT_BUTTON_BY_SURFACE[surface]}
        className={signOut()}
      />
    </div>
  );
};

import { SignOutButton } from '@platform/components/features/layout/sign-out-button';
import { useTranslations } from 'next-intl';

import { signedInAccountVariants } from './signed-in-account-variants';

export type TSignedInAccountProps = {
  email: string;
};

export const SignedInAccount = ({ email }: TSignedInAccountProps) => {
  const t = useTranslations('account');
  const { root, email: emailSlot } = signedInAccountVariants();

  return (
    <div className={root()}>
      <p className={emailSlot()}>{t('signedInAs', { email })}</p>
      <SignOutButton />
    </div>
  );
};

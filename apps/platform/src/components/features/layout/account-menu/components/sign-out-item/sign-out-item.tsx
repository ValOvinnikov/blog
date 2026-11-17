import { Menu } from '@base-ui/react/menu';
import { Icon } from '@platform/components/shared/icon';
import { menuSurfaceVariants } from '@platform/components/shared/menu-surface';
import { Spinner } from '@platform/components/shared/spinner';
import { SPINNER_TONE } from '@platform/constants/spinner';
import { signOutAction } from '@platform/server/auth/sign-out-action';
import { ICONS, SIZE } from '@shinefold/config';
import { useTranslations } from 'next-intl';
import { type Ref, useTransition } from 'react';

import { signOutItemVariants } from './sign-out-item-variants';

export type TSignOutItemProps = {
  ref: Ref<HTMLDivElement>;
};

export const SignOutItem = ({ ref }: TSignOutItemProps) => {
  const t = useTranslations('account');
  const [isSigningOut, startSignOut] = useTransition();
  const { item } = menuSurfaceVariants();
  const { icon } = signOutItemVariants();

  const handleSignOut = () => {
    if (isSigningOut) return;
    startSignOut(() => signOutAction());
  };

  return (
    <Menu.Item
      ref={ref}
      closeOnClick={false}
      aria-disabled={isSigningOut || undefined}
      className={item()}
      onClick={handleSignOut}
    >
      {isSigningOut ? (
        <Spinner
          label=""
          size={SIZE.SM}
          tone={SPINNER_TONE.TEXT}
          className={icon()}
        />
      ) : (
        <Icon name={ICONS.POWER} className={icon()} />
      )}
      {isSigningOut ? t('signingOut') : t('signOut')}
    </Menu.Item>
  );
};

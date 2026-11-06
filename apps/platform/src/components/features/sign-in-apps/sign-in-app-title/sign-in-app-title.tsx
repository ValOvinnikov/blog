import type { TOAuthProvider } from '@blog/config/constants';
import { Icon } from '@platform/components/shared/icon';
import { ICON_SIZE } from '@platform/constants/icon';
import { OAUTH_PROVIDER_ICON } from '@platform/constants/sign-in-apps';
import { useTranslations } from 'next-intl';

import { signInAppTitleVariants } from './sign-in-app-title-variants';

export type TSignInAppTitleProps = {
  provider: TOAuthProvider;
};

export const SignInAppTitle = ({ provider }: TSignInAppTitleProps) => {
  const t = useTranslations('signInAppsPage.providerName');

  return (
    <span className={signInAppTitleVariants()}>
      <Icon name={OAUTH_PROVIDER_ICON[provider]} size={ICON_SIZE.XL} />
      {t(provider)}
    </span>
  );
};

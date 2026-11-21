import { Icon } from '@platform/components/shared/icon';
import { ICON_SIZE } from '@platform/constants/icon';
import { OAUTH_PROVIDER_ICON } from '@platform/constants/sign-in-apps';
import { useProviderName } from '@platform/utils/use-provider-name/use-provider-name';
import type { TOAuthProvider } from '@shinefold/config/constants';

import { signInAppTitleVariants } from './sign-in-app-title-variants';

export type TSignInAppTitleProps = {
  provider: TOAuthProvider;
};

export const SignInAppTitle = ({ provider }: TSignInAppTitleProps) => {
  const toProviderName = useProviderName();

  return (
    <span className={signInAppTitleVariants()}>
      <Icon name={OAUTH_PROVIDER_ICON[provider]} size={ICON_SIZE.XL} />
      {toProviderName(provider)}
    </span>
  );
};

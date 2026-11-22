import { SignInAppStatusBadge } from '@platform/components/features/sign-in-apps/sign-in-app-status-badge';
import { SignInAppTitle } from '@platform/components/features/sign-in-apps/sign-in-app-title';
import { useProviderName } from '@platform/utils/use-provider-name/use-provider-name';
import type { TOAuthProvider } from '@shinefold/config/constants';
import { useTranslations } from 'next-intl';

export const useSignInAppCardHeader = (
  provider: TOAuthProvider,
  hasOwnApp: boolean,
) => {
  const t = useTranslations('signInAppsPage');
  const providerName = useProviderName()(provider);

  return {
    providerName,
    header: {
      title: <SignInAppTitle provider={provider} />,
      supportingText: t(hasOwnApp ? 'ownDescription' : 'sharedDescription', {
        provider: providerName,
      }),
      actions: <SignInAppStatusBadge hasOwnApp={hasOwnApp} />,
    },
  };
};

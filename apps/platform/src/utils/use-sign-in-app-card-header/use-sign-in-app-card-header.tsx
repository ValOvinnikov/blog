import { SignInAppStatusBadge } from '@platform/components/features/sign-in-apps/sign-in-app-status-badge';
import { SignInAppTitle } from '@platform/components/features/sign-in-apps/sign-in-app-title';
import type { TOAuthProvider } from '@shinefold/config/constants';
import { useTranslations } from 'next-intl';

export const useSignInAppCardHeader = (
  provider: TOAuthProvider,
  hasOwnApp: boolean,
) => {
  const t = useTranslations('signInAppsPage');
  const tProvider = useTranslations('signInAppsPage.providerName');
  const providerName = tProvider(provider);

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

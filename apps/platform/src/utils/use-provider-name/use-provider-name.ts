import type { TOAuthProvider } from '@shinefold/config/constants';
import { useTranslations } from 'next-intl';

export const useProviderName = () => {
  const t = useTranslations('signInAppsPage.providerName');

  return (provider: TOAuthProvider) => t(provider);
};

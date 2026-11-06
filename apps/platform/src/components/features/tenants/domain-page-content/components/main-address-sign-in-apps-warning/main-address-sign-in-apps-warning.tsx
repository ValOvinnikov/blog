'use client';

import { ALERT_TYPE } from '@blog/config';
import { hasLength } from '@blog/utils/primitives';
import { useMainAddressSignInApps } from '@platform/components/features/tenants/domain-page-content/components/main-address-sign-in-apps-provider/main-address-sign-in-apps-provider';
import { Alert } from '@platform/components/shared/alert';
import { useFormatter, useTranslations } from 'next-intl';

export const MainAddressSignInAppsWarning = () => {
  const t = useTranslations('tenantDomainPage.ownDomain.mainAddress');
  const tProvider = useTranslations('signInAppsPage.providerName');
  const format = useFormatter();
  const providers = useMainAddressSignInApps();

  if (!hasLength(providers)) return null;

  const [onlyProvider] = providers;
  const description =
    providers.length === 1 && onlyProvider
      ? t('signInAppsWarningOne', { provider: tProvider(onlyProvider) })
      : t('signInAppsWarningMany', {
          providers: format.list(
            providers.map((provider) => tProvider(provider)),
            { type: 'conjunction' },
          ),
        });

  return (
    <Alert type={ALERT_TYPE.WARNING} role="note" description={description} />
  );
};

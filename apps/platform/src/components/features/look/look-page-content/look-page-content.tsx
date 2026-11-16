import { LookForm } from '@platform/components/features/look/look-form';
import { PoweredByMarkProvider } from '@platform/context/powered-by-mark-provider';
import type { TPlatformViewer } from '@platform/server/auth/platform-viewer';
import { getEnabledCapabilities } from '@platform/server/settings-features/get-enabled-capabilities';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import { lookFormValuesOrDefaults } from '@platform/utils/to-look-form-values/to-look-form-values';
import { CAPABILITY } from '@shinefold/config';
import { queries } from '@shinefold/db';
import { toEffectiveLook } from '@shinefold/db/utils/effective-look/effective-look';

export type TLookPageContentProps = {
  tenant: TPlatformTenant;
  viewer: TPlatformViewer;
};

export const LookPageContent = async ({
  tenant,
  viewer,
}: TLookPageContentProps) => {
  const [siteConfig, enabledCapabilities] = await Promise.all([
    queries.siteConfig.getSiteConfig(tenant.id),
    getEnabledCapabilities(tenant),
  ]);
  const liveLocales = queries.tenants.selectLiveLocales(tenant);

  return (
    <PoweredByMarkProvider
      hasPoweredByMark={tenant.entitlements.hasPoweredByMark}
    >
      <LookForm
        tenant={{
          id: tenant.id,
          name: tenant.name,
          siteHost: tenant.primaryDomain,
          plan: tenant.plan,
          archivedAt: tenant.archivedAt,
        }}
        initialValues={toEffectiveLook(
          lookFormValuesOrDefaults(siteConfig),
          tenant.plan,
        )}
        isOperator={viewer.isOperator}
        liveLocales={liveLocales}
        hasReaderAccounts={enabledCapabilities.includes(
          CAPABILITY.READER_ACCOUNTS,
        )}
        hasCookieBanner={enabledCapabilities.includes(
          CAPABILITY.CONSENT_BANNER,
        )}
        savedAt={siteConfig?.updatedAt}
      />
    </PoweredByMarkProvider>
  );
};

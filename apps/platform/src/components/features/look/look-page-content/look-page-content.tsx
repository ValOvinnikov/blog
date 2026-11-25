import { LookForm } from '@platform/components/features/look/look-form';
import { PoweredByMarkProvider } from '@platform/context/powered-by-mark-provider';
import type { TPlatformViewer } from '@platform/server/auth/platform-viewer';
import { getEnabledCapabilities } from '@platform/server/settings-features/get-enabled-capabilities';
import { toGrantTarget } from '@platform/utils/grant-target/grant-target';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import { lookFormValuesOrDefaults } from '@platform/utils/to-look-form-values/to-look-form-values';
import { CAPABILITY, OPEN_PRESET_IDS } from '@shinefold/config';
import { queries } from '@shinefold/db';
import { toEffectiveLookWithin } from '@shinefold/db/utils/effective-look/effective-look';

export type TLookPageContentProps = {
  tenant: TPlatformTenant;
  viewer: TPlatformViewer;
  canGrantEntitlements?: boolean;
};

export const LookPageContent = async ({
  tenant,
  viewer,
  canGrantEntitlements = false,
}: TLookPageContentProps) => {
  const [siteConfig, enabledCapabilities] = await Promise.all([
    queries.siteConfig.getSiteConfig(tenant.id),
    getEnabledCapabilities(tenant),
  ]);
  const liveLocales = queries.tenants.selectLiveLocalesWithin(
    tenant,
    tenant.entitlements,
  );

  return (
    <PoweredByMarkProvider
      hasPoweredByMark={tenant.entitlements.hasPoweredByMark}
    >
      <LookForm
        tenant={{
          id: tenant.id,
          name: tenant.name,
          siteHost: tenant.primaryDomain,
          presets: [...OPEN_PRESET_IDS, ...tenant.entitlements.unlockedPresets],
          grants: {
            target: toGrantTarget(tenant, canGrantEntitlements),
            granted: tenant.grantedEntitlements.lookFields,
          },
          lookFields: tenant.entitlements.lookFields,
          archivedAt: tenant.archivedAt,
        }}
        initialValues={toEffectiveLookWithin(
          lookFormValuesOrDefaults(siteConfig),
          tenant.entitlements,
        )}
        isOperator={viewer.isOperator}
        liveLocales={liveLocales}
        features={{
          hasReaderAccounts: enabledCapabilities.includes(
            CAPABILITY.READER_ACCOUNTS,
          ),
          hasBookmarks: enabledCapabilities.includes(CAPABILITY.BOOKMARKS),
          hasCookieBanner: enabledCapabilities.includes(
            CAPABILITY.CONSENT_BANNER,
          ),
        }}
        savedAt={siteConfig?.updatedAt}
      />
    </PoweredByMarkProvider>
  );
};

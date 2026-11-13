import { CAPABILITY } from '@blog/config';
import { queries } from '@blog/db';
import { toEffectiveLook } from '@blog/db/utils/effective-look/effective-look';
import { LookForm } from '@platform/components/features/look/look-form';
import { PoweredByMarkProvider } from '@platform/context/powered-by-mark-provider';
import type { TPlatformViewer } from '@platform/server/auth/platform-viewer';
import { getEnabledCapabilities } from '@platform/server/settings-features/get-enabled-capabilities';
import { env } from '@platform/utils/env/env';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import { toPoweredByProductName } from '@platform/utils/powered-by-product-name/powered-by-product-name';
import { lookFormValuesOrDefaults } from '@platform/utils/to-look-form-values/to-look-form-values';

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
      productName={toPoweredByProductName(
        tenant.entitlements,
        env.PRODUCT_NAME,
      )}
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

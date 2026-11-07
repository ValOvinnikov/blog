import { CAPABILITY } from '@blog/config';
import { queries } from '@blog/db';
import type { TAdmin } from '@blog/db/schema/admins';
import type { TMembership } from '@blog/db/schema/memberships';
import type { TTenant } from '@blog/db/schema/tenants';
import { toEffectiveLook } from '@blog/db/utils/effective-look/effective-look';
import { LookForm } from '@platform/components/features/look/look-form';
import { PoweredByMarkProvider } from '@platform/context/powered-by-mark-provider';
import { isOperatorView } from '@platform/server/auth/is-operator-view';
import { getEnabledCapabilities } from '@platform/server/settings-features/get-enabled-capabilities';
import { lookFormValuesOrDefaults } from '@platform/utils/default-look-values/default-look-values';
import { env } from '@platform/utils/env/env';
import { toPoweredByProductName } from '@platform/utils/powered-by-product-name/powered-by-product-name';

export type TLookPageContentProps = {
  tenant: TTenant;
  membership?: TMembership;
  admin?: TAdmin;
};

export const LookPageContent = async ({
  tenant,
  membership,
  admin,
}: TLookPageContentProps) => {
  const [siteConfig, enabledCapabilities] = await Promise.all([
    queries.siteConfig.getSiteConfig(tenant.id),
    getEnabledCapabilities(tenant),
  ]);
  const liveLocales = queries.tenants.selectLiveLocales(tenant);

  return (
    <PoweredByMarkProvider
      productName={toPoweredByProductName(tenant.plan, env.PRODUCT_NAME)}
    >
      <LookForm
        tenantId={tenant.id}
        tenantName={tenant.name}
        siteHost={tenant.primaryDomain}
        initialValues={toEffectiveLook(
          lookFormValuesOrDefaults(siteConfig),
          tenant.plan,
        )}
        plan={tenant.plan}
        isOperator={isOperatorView({ admin, membership })}
        liveLocales={liveLocales}
        hasReaderAccounts={enabledCapabilities.includes(
          CAPABILITY.READER_ACCOUNTS,
        )}
        hasCookieBanner={enabledCapabilities.includes(
          CAPABILITY.CONSENT_BANNER,
        )}
        savedAt={siteConfig?.updatedAt}
        archivedAt={tenant.deprovisionedAt ?? undefined}
      />
    </PoweredByMarkProvider>
  );
};

import { CAPABILITY, READER_ACCOUNT_CAPABILITIES } from '@blog/config';
import { queries } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import { toEffectiveLook } from '@blog/db/utils/effective-look/effective-look';
import { LookForm } from '@platform/components/features/look/look-form';
import { getEnabledCapabilities } from '@platform/server/settings-features/get-enabled-capabilities';
import { lookFormValuesOrDefaults } from '@platform/utils/default-look-values/default-look-values';

export type TLookPageContentProps = {
  tenant: TTenant;
};

export const LookPageContent = async ({ tenant }: TLookPageContentProps) => {
  const [siteConfig, enabledCapabilities] = await Promise.all([
    queries.siteConfig.getSiteConfig(tenant.id),
    getEnabledCapabilities(tenant),
  ]);
  const liveLocales = queries.tenants.selectLiveLocales(tenant);

  return (
    <LookForm
      tenantId={tenant.id}
      tenantName={tenant.name}
      initialValues={toEffectiveLook(
        lookFormValuesOrDefaults(siteConfig),
        tenant.plan,
      )}
      plan={tenant.plan}
      liveLocales={liveLocales}
      hasReaderAccounts={READER_ACCOUNT_CAPABILITIES.some((capability) =>
        enabledCapabilities.includes(capability),
      )}
      hasCookieBanner={enabledCapabilities.includes(CAPABILITY.CONSENT_BANNER)}
      savedAt={siteConfig?.updatedAt}
      archivedAt={tenant.deprovisionedAt ?? undefined}
    />
  );
};

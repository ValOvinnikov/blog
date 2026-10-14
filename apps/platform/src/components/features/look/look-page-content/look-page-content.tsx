import { queries } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import { LookForm } from '@platform/components/features/look/look-form';
import { lookFormValuesOrDefaults } from '@platform/utils/default-look-values/default-look-values';

export type TLookPageContentProps = {
  tenant: TTenant;
};

export const LookPageContent = async ({ tenant }: TLookPageContentProps) => {
  const siteConfig = await queries.siteConfig.getSiteConfig(tenant.id);
  const liveLocales = queries.tenants.selectLiveLocales(tenant);

  return (
    <LookForm
      tenantId={tenant.id}
      tenantName={tenant.name}
      initialValues={lookFormValuesOrDefaults(siteConfig)}
      liveLocales={liveLocales}
      savedAt={siteConfig?.updatedAt}
      archivedAt={tenant.deprovisionedAt ?? undefined}
    />
  );
};

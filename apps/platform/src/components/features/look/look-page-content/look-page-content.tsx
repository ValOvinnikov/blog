import { queries } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import { LookForm } from '@platform/components/features/look/look-form';
import {
  defaultLookFormValues,
  toLookFormValues,
} from '@platform/utils/default-look-values/default-look-values';

export type TLookPageContentProps = {
  tenant: TTenant;
};

export const LookPageContent = async ({ tenant }: TLookPageContentProps) => {
  const [siteConfig, liveLocales] = await Promise.all([
    queries.siteConfig.getSiteConfig(tenant.id),
    queries.tenants.getTenantLiveLocales(tenant.id),
  ]);

  const initialValues = siteConfig
    ? toLookFormValues(siteConfig)
    : defaultLookFormValues();

  return (
    <LookForm
      tenantId={tenant.id}
      tenantName={tenant.name}
      initialValues={initialValues}
      liveLocales={liveLocales ?? []}
      savedAt={siteConfig?.updatedAt}
      archivedAt={tenant.deprovisionedAt ?? undefined}
    />
  );
};

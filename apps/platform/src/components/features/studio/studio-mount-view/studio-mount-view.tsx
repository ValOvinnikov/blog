import { ALERT_TYPE } from '@blog/config';
import { queries } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import { StudioMount } from '@blog/studio';
import { Alert } from '@platform/components/shared/alert';
import { ArchivedTenantNotice } from '@platform/components/shared/archived-tenant-notice';
import { PageHeader } from '@platform/components/shared/page-header';
import { getTranslations } from 'next-intl/server';

export type TStudioMountViewProps = {
  tenant: TTenant;
  basePath: string;
};

/**
 * Studio owns everything under its catch-all route with its own
 * client-side router.
 */
export const StudioMountView = async ({
  tenant,
  basePath,
}: TStudioMountViewProps) => {
  const t = await getTranslations('studioPage');

  if (tenant.deprovisionedAt) {
    return (
      <>
        <PageHeader title={t('title')} />
        <ArchivedTenantNotice archivedAt={tenant.deprovisionedAt} />
      </>
    );
  }

  const credentials = await queries.tenants.getTenantSanityCredentials(
    tenant.id,
  );

  if (!credentials) {
    return (
      <>
        <PageHeader title={t('title')} />
        <Alert
          type={ALERT_TYPE.WARNING}
          title={t('notProvisionedTitle')}
          description={t('notProvisionedDescription')}
        />
      </>
    );
  }

  return (
    <StudioMount
      projectId={credentials.projectId}
      dataset={credentials.dataset}
      basePath={basePath}
      title={tenant.name}
    />
  );
};

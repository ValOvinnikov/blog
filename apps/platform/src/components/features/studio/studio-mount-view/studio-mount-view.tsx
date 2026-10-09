import { ALERT_TYPE } from '@blog/config';
import { queries } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import { StudioMount } from '@blog/studio';
import { Alert } from '@platform/components/shared/alert';
import { ArchivedTenantNotice } from '@platform/components/shared/archived-tenant-notice';
import { PageHeader } from '@platform/components/shared/page-header';
import { getEnabledCapabilities } from '@platform/server/settings-features/get-enabled-capabilities';
import { getTranslations } from 'next-intl/server';

import { studioMountViewVariants } from './studio-mount-view-variants';

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
  const { root } = studioMountViewVariants();

  if (tenant.deprovisionedAt) {
    return (
      <div className={root()}>
        <PageHeader title={t('title')} />
        <ArchivedTenantNotice archivedAt={tenant.deprovisionedAt} />
      </div>
    );
  }

  const credentials = await queries.tenants.getTenantSanityCredentials(
    tenant.id,
  );

  if (!credentials) {
    return (
      <div className={root()}>
        <PageHeader title={t('title')} />
        <Alert
          type={ALERT_TYPE.WARNING}
          title={t('notProvisionedTitle')}
          description={t('notProvisionedDescription')}
        />
      </div>
    );
  }

  const enabledCapabilities = await getEnabledCapabilities(tenant);
  const liveLocales = await queries.tenants.getTenantLiveLocales(tenant.id);

  return (
    <StudioMount
      projectId={credentials.projectId}
      dataset={credentials.dataset}
      basePath={basePath}
      title={tenant.name}
      enabledCapabilities={enabledCapabilities}
      defaultLocale={tenant.locale}
      liveLocales={liveLocales}
    />
  );
};

import { ALERT_TYPE } from '@blog/config';
import { queries } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import { StudioMount } from '@blog/studio';
import { shellFrameVariants } from '@platform/components/features/layout/admin-shell/components/shell-frame/shell-frame-variants';
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

export const StudioMountView = async ({
  tenant,
  basePath,
}: TStudioMountViewProps) => {
  const t = await getTranslations('studioPage');
  const { root } = studioMountViewVariants();
  const { content: paddedColumn } = shellFrameVariants({ isFullBleed: false });

  if (tenant.deprovisionedAt) {
    return (
      <div className={paddedColumn()}>
        <div className={root()}>
          <PageHeader title={t('title')} />
          <ArchivedTenantNotice archivedAt={tenant.deprovisionedAt} />
        </div>
      </div>
    );
  }

  const { sanityProjectId, sanityDataset, sanityReadTokenEncrypted } = tenant;

  if (!sanityProjectId || !sanityDataset || !sanityReadTokenEncrypted) {
    return (
      <div className={paddedColumn()}>
        <div className={root()}>
          <PageHeader title={t('title')} />
          <Alert
            type={ALERT_TYPE.WARNING}
            title={t('notProvisionedTitle')}
            description={t('notProvisionedDescription')}
          />
        </div>
      </div>
    );
  }

  const enabledCapabilities = await getEnabledCapabilities(tenant);
  const liveLocales = queries.tenants.selectLiveLocales(tenant);

  return (
    <StudioMount
      projectId={sanityProjectId}
      dataset={sanityDataset}
      basePath={basePath}
      title={tenant.name}
      enabledCapabilities={enabledCapabilities}
      defaultLocale={tenant.locale}
      liveLocales={liveLocales}
    />
  );
};

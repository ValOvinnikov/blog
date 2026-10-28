import { ALERT_TYPE, type TSanityLoginProvider } from '@blog/config';
import { queries } from '@blog/db';
import { PLAN_ENTITLEMENTS } from '@blog/db/constants';
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
  loginProvider?: TSanityLoginProvider;
};

export const StudioMountView = async ({
  tenant,
  basePath,
  loginProvider,
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

  const { sanityProjectId, sanityDataset, sanityReadTokenEncrypted } = tenant;

  if (!sanityProjectId || !sanityDataset || !sanityReadTokenEncrypted) {
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
  const liveLocales = queries.tenants.selectLiveLocales(tenant);
  const { modulePacks } = PLAN_ENTITLEMENTS[tenant.plan];

  return (
    <StudioMount
      projectId={sanityProjectId}
      dataset={sanityDataset}
      basePath={basePath}
      title={tenant.name}
      enabledCapabilities={enabledCapabilities}
      entitlements={{ modulePacks }}
      defaultLocale={tenant.locale}
      liveLocales={liveLocales}
      loginProvider={loginProvider}
    />
  );
};

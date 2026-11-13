import { ALERT_TYPE, type TSanityLoginProvider } from '@blog/config';
import { queries } from '@blog/db';
import { PlatformStudioMount } from '@platform/components/features/studio/platform-studio-mount';
import { Alert } from '@platform/components/shared/alert';
import { ArchivedTenantNotice } from '@platform/components/shared/archived-tenant-notice';
import { PageHeader } from '@platform/components/shared/page-header';
import { getEnabledCapabilities } from '@platform/server/settings-features/get-enabled-capabilities';
import { resolveIsPlatformTenant } from '@platform/server/tenants/resolve-is-platform-tenant';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import { getTranslations } from 'next-intl/server';

import { studioMountViewVariants } from './studio-mount-view-variants';

export type TStudioMountViewProps = {
  tenant: TPlatformTenant;
  basePath: string;
  loginProvider?: TSanityLoginProvider;
  shouldRecordFirstEntry?: boolean;
};

export const StudioMountView = async ({
  tenant,
  basePath,
  loginProvider,
  shouldRecordFirstEntry,
}: TStudioMountViewProps) => {
  const t = await getTranslations('studioPage');
  const { root } = studioMountViewVariants();

  if (tenant.archivedAt) {
    return (
      <div className={root()}>
        <PageHeader title={t('title')} />
        <ArchivedTenantNotice archivedAt={tenant.archivedAt} />
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

  const [enabledCapabilities, canLinkPlatformPlans] = await Promise.all([
    getEnabledCapabilities(tenant),
    resolveIsPlatformTenant(tenant),
  ]);
  const liveLocales = queries.tenants.selectLiveLocales(tenant);
  const { modulePacks } = tenant.entitlements;

  return (
    <PlatformStudioMount
      projectId={sanityProjectId}
      dataset={sanityDataset}
      basePath={basePath}
      title={tenant.name}
      enabledCapabilities={enabledCapabilities}
      entitlements={{ modulePacks }}
      canLinkPlatformPlans={canLinkPlatformPlans}
      defaultLocale={tenant.locale}
      liveLocales={liveLocales}
      loginProvider={loginProvider}
      firstEntryTenantId={shouldRecordFirstEntry ? tenant.id : undefined}
    />
  );
};

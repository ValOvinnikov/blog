import { PlatformStudioMount } from '@platform/components/features/studio/platform-studio-mount';
import { Alert } from '@platform/components/shared/alert';
import { ArchivedTenantNotice } from '@platform/components/shared/archived-tenant-notice';
import { PageHeader } from '@platform/components/shared/page-header';
import { PageStack } from '@platform/components/shared/page-stack';
import { getEnabledCapabilities } from '@platform/server/settings-features/get-enabled-capabilities';
import { resolveIsPlatformTenant } from '@platform/server/tenants/resolve-is-platform-tenant';
import { contentColumnClasses } from '@platform/utils/content-column-classes/content-column-classes';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import { ALERT_TYPE, type TSanityLoginProvider } from '@shinefold/config';
import { queries } from '@shinefold/db';
import { getTranslations } from 'next-intl/server';

export type TStudioMountViewProps = {
  tenant: TPlatformTenant;
  basePath: string;
  previewBasePath: string;
  loginProvider?: TSanityLoginProvider;
  shouldRecordFirstEntry?: boolean;
};

export const StudioMountView = async ({
  tenant,
  basePath,
  previewBasePath,
  loginProvider,
  shouldRecordFirstEntry,
}: TStudioMountViewProps) => {
  const t = await getTranslations('studioPage');

  if (tenant.archivedAt) {
    return (
      <PageStack className={contentColumnClasses()}>
        <PageHeader title={t('title')} />
        <ArchivedTenantNotice archivedAt={tenant.archivedAt} />
      </PageStack>
    );
  }

  const { sanityProjectId, sanityDataset, sanityReadTokenEncrypted } = tenant;

  if (!sanityProjectId || !sanityDataset || !sanityReadTokenEncrypted) {
    return (
      <PageStack className={contentColumnClasses()}>
        <PageHeader title={t('title')} />
        <Alert
          type={ALERT_TYPE.WARNING}
          title={t('notProvisionedTitle')}
          description={t('notProvisionedDescription')}
        />
      </PageStack>
    );
  }

  const [enabledCapabilities, canLinkPlatformPlans] = await Promise.all([
    getEnabledCapabilities(tenant),
    resolveIsPlatformTenant(tenant),
  ]);
  const liveLocales = queries.tenants.selectLiveLocalesWithin(
    tenant,
    tenant.entitlements,
  );
  const { modulePacks } = tenant.entitlements;

  return (
    <PlatformStudioMount
      projectId={sanityProjectId}
      dataset={sanityDataset}
      basePath={basePath}
      previewBasePath={previewBasePath}
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

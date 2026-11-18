import { LanguagesSettings } from '@platform/components/features/languages/languages-settings';
import { toGrantTarget } from '@platform/utils/grant-target/grant-target';
import { toAdditionalLanguages } from '@platform/utils/locale-limit/locale-limit';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import { queries } from '@shinefold/db';

export type TLanguagesPageContentProps = {
  tenant: TPlatformTenant;
  canGrantEntitlements?: boolean;
};

export const LanguagesPageContent = async ({
  tenant,
  canGrantEntitlements = false,
}: TLanguagesPageContentProps) => {
  const {
    id,
    locale,
    additionalLocales,
    entitlements,
    grantedEntitlements,
    updatedAt,
    archivedAt,
  } = tenant;

  const [, ...liveAdditionalLocales] = queries.tenants.selectLiveLocalesWithin(
    tenant,
    entitlements,
  );

  return (
    <LanguagesSettings
      tenantId={id}
      defaultLocale={locale}
      locales={{
        stored: additionalLocales,
        live: liveAdditionalLocales,
        limit: toAdditionalLanguages(entitlements.localeLimit),
      }}
      grants={{
        target: toGrantTarget(tenant, canGrantEntitlements),
        granted: grantedEntitlements.localeLimit,
      }}
      savedAt={updatedAt}
      archivedAt={archivedAt}
    />
  );
};

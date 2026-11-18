import { LanguagesSettings } from '@platform/components/features/languages/languages-settings';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import { queries } from '@shinefold/db';

export type TLanguagesPageContentProps = {
  tenant: TPlatformTenant;
};

export const LanguagesPageContent = async ({
  tenant,
}: TLanguagesPageContentProps) => {
  const { id, locale, additionalLocales, entitlements, updatedAt, archivedAt } =
    tenant;

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
        limit: entitlements.localeLimit - 1,
      }}
      savedAt={updatedAt}
      archivedAt={archivedAt}
    />
  );
};

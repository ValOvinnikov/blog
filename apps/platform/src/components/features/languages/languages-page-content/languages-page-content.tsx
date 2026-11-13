import { queries } from '@blog/db';
import { PLAN_LOCALE_LIMIT } from '@blog/db/constants';
import { LanguagesSettings } from '@platform/components/features/languages/languages-settings';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';

export type TLanguagesPageContentProps = {
  tenant: TPlatformTenant;
};

export const LanguagesPageContent = async ({
  tenant,
}: TLanguagesPageContentProps) => {
  const { id, locale, additionalLocales, plan, updatedAt, archivedAt } = tenant;

  const [, ...liveAdditionalLocales] =
    queries.tenants.selectLiveLocales(tenant);

  return (
    <LanguagesSettings
      tenantId={id}
      defaultLocale={locale}
      locales={{
        stored: additionalLocales,
        live: liveAdditionalLocales,
        limit: PLAN_LOCALE_LIMIT[plan] - 1,
      }}
      savedAt={updatedAt}
      archivedAt={archivedAt}
    />
  );
};

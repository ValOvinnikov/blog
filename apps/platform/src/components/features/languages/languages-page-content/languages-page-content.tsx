import { queries } from '@blog/db';
import { PLAN_LOCALE_LIMIT } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { LanguagesSettings } from '@platform/components/features/languages/languages-settings';
import { updateTenantLanguagesAction } from '@platform/server/tenants/update-tenant-languages-action';

export type TLanguagesPageContentProps = {
  tenant: TTenant;
};

export const LanguagesPageContent = async ({
  tenant,
}: TLanguagesPageContentProps) => {
  const { id, locale, additionalLocales, plan, updatedAt, deprovisionedAt } =
    tenant;

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
      saveAction={updateTenantLanguagesAction}
      savedAt={updatedAt}
      archivedAt={deprovisionedAt ?? undefined}
    />
  );
};

import { queries } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import { EmailSettings } from '@platform/components/features/email/email-settings';
import { loadTenantEmailBrand } from '@platform/server/email/load-tenant-email-brand';
import { buildEmailDraft } from '@platform/utils/email-draft/email-draft';

export type TEmailPageContentProps = {
  tenant: TTenant;
};

export const EmailPageContent = async ({ tenant }: TEmailPageContentProps) => {
  const [brand, emailConfig, templateLogoUrls, authored] = await Promise.all([
    loadTenantEmailBrand(tenant.id),
    queries.emailConfig.getEmailConfig(tenant.id),
    queries.emailTemplates.listEmailTemplateLogoUrls(tenant.id),
    queries.emailTemplates.listAuthoredEmailTemplates(tenant.id),
  ]);

  const liveLocales = queries.tenants.selectLiveLocales(tenant);

  const initialDraft = buildEmailDraft({
    sender: {
      senderName: emailConfig?.senderName ?? '',
      replyToAddress: emailConfig?.replyToAddress ?? '',
      footerPostalAddress: emailConfig?.footerPostalAddress ?? '',
    },
    senderLogoUrl: emailConfig?.logoAssetUrl,
    authored,
    templateLogoUrls,
    liveLocales,
  });

  return (
    <EmailSettings
      tenantId={tenant.id}
      initialDraft={initialDraft}
      defaultLocale={tenant.locale}
      liveLocales={liveLocales}
      brand={brand}
      brandName={tenant.name}
      savedAt={emailConfig?.updatedAt}
      archivedAt={tenant.deprovisionedAt ?? undefined}
    />
  );
};

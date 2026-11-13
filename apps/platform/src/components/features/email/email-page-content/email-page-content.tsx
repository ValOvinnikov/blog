import { queries } from '@blog/db';
import { EmailSettings } from '@platform/components/features/email/email-settings';
import { canEditContactRecipient } from '@platform/server/auth/can-edit-contact-recipient';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { toTenantEmailBrand } from '@platform/server/email/load-tenant-email-brand';
import { buildEmailDraft } from '@platform/utils/email-draft/email-draft';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';

export type TEmailPageContentProps = {
  tenant: TPlatformTenant;
};

export const EmailPageContent = async ({ tenant }: TEmailPageContentProps) => {
  const { id, name, locale, archivedAt } = tenant;
  const [siteConfig, emailConfig, templateLogoUrls, authored, { viewer }] =
    await Promise.all([
      queries.siteConfig.getSiteConfig(id),
      queries.emailConfig.getEmailConfig(id),
      queries.emailTemplates.listEmailTemplateLogoUrls(id),
      queries.emailTemplates.listAuthoredEmailTemplates(id),
      requireTenantMembership(id),
    ]);

  const liveLocales = queries.tenants.selectLiveLocales(tenant);

  const initialDraft = buildEmailDraft({
    sender: {
      senderName: emailConfig?.senderName ?? '',
      replyToAddress: emailConfig?.replyToAddress ?? '',
      footerPostalAddress: emailConfig?.footerPostalAddress ?? '',
      ...(canEditContactRecipient(tenant, viewer) && {
        contactRecipient: emailConfig?.contactRecipient ?? '',
      }),
    },
    senderLogoUrl: emailConfig?.logoAssetUrl,
    authored,
    templateLogoUrls,
    liveLocales,
  });

  return (
    <EmailSettings
      tenant={{ id, locale, archivedAt }}
      initialDraft={initialDraft}
      liveLocales={liveLocales}
      brand={toTenantEmailBrand(siteConfig)}
      brandName={siteConfig?.brandName ?? name}
      savedAt={emailConfig?.updatedAt}
    />
  );
};

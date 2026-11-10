import { queries } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import { EmailSettings } from '@platform/components/features/email/email-settings';
import { canEditContactRecipient } from '@platform/server/auth/can-edit-contact-recipient';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { toTenantEmailBrand } from '@platform/server/email/load-tenant-email-brand';
import { buildEmailDraft } from '@platform/utils/email-draft/email-draft';

export type TEmailPageContentProps = {
  tenant: TTenant;
};

export const EmailPageContent = async ({ tenant }: TEmailPageContentProps) => {
  const { id, name, locale, deprovisionedAt } = tenant;
  const [siteConfig, emailConfig, templateLogoUrls, authored, { membership }] =
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
      ...(canEditContactRecipient(tenant, membership) && {
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
      tenant={{ id, locale, deprovisionedAt }}
      initialDraft={initialDraft}
      liveLocales={liveLocales}
      brand={toTenantEmailBrand(siteConfig)}
      brandName={siteConfig?.brandName ?? name}
      savedAt={emailConfig?.updatedAt}
    />
  );
};

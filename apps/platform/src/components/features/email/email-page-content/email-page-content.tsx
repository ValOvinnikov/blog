import { resolveTenantEmailBrand, type TEmailTemplateType } from '@blog/config';
import { queries } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import { EmailSettings } from '@platform/components/features/email/email-settings';
import {
  defaultLookFormValues,
  toLookFormValues,
} from '@platform/utils/default-look-values/default-look-values';
import { buildEmailDraft } from '@platform/utils/email-draft/email-draft';

export type TEmailPageContentProps = {
  tenant: TTenant;
};

export const EmailPageContent = async ({ tenant }: TEmailPageContentProps) => {
  const [siteConfig, emailConfig, templates, authored] = await Promise.all([
    queries.siteConfig.getSiteConfig(tenant.id),
    queries.emailConfig.getEmailConfig(tenant.id),
    queries.emailTemplates.listEmailTemplates(tenant.id),
    queries.emailTemplates.listAuthoredEmailTemplates(tenant.id),
  ]);

  const lookValues = siteConfig
    ? toLookFormValues(siteConfig)
    : defaultLookFormValues();

  const brand = resolveTenantEmailBrand({
    preset: lookValues.preset,
    accentHue: lookValues.accentHue,
    logoHue: lookValues.logoHue,
  });

  const liveLocales = queries.tenants.selectLiveLocales(tenant);

  const initialDraft = buildEmailDraft({
    sender: {
      senderName: emailConfig?.senderName ?? '',
      replyToAddress: emailConfig?.replyToAddress ?? '',
      footerPostalAddress: emailConfig?.footerPostalAddress ?? '',
    },
    senderLogoUrl: emailConfig?.logoAssetUrl,
    authored,
    templateLogoUrls: Object.fromEntries(
      templates.map(({ templateType, logoAssetUrl }) => [
        templateType,
        logoAssetUrl,
      ]),
    ) as Record<TEmailTemplateType, string | undefined>,
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
      archivedAt={tenant.deprovisionedAt ?? undefined}
    />
  );
};

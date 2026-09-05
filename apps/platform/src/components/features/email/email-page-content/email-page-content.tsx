import { resolveTenantEmailBrand, type TEmailTemplateType } from '@blog/config';
import { queries } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import { EmailForm } from '@platform/components/features/email/email-form';
import type { TEmailTemplateEditorValues } from '@platform/components/features/email/email-template-editor';
import {
  defaultLookFormValues,
  toLookFormValues,
} from '@platform/utils/default-look-values/default-look-values';

export type TEmailPageContentProps = {
  tenant: TTenant;
};

/**
 * The Email tab's data-fetch + render, mirroring `LookPageContent` — one
 * component shared by `/tenants/[tenantId]/email` and `/dashboard/email`,
 * both resolving a `TTenant` however fits their own routing and handing it
 * here. Every field this reads comes back fully populated: `getEmailConfig`
 * can return `undefined` for a tenant with no row yet, but `listEmailTemplates`
 * never does — it merges authored copy over product defaults per field.
 */
export const EmailPageContent = async ({ tenant }: TEmailPageContentProps) => {
  const [siteConfig, emailConfig, templateResults] = await Promise.all([
    queries.siteConfig.getSiteConfig(tenant.id),
    queries.emailConfig.getEmailConfig(tenant.id),
    queries.emailTemplates.listEmailTemplates(tenant.id),
  ]);

  const lookValues = siteConfig
    ? toLookFormValues(siteConfig)
    : defaultLookFormValues();

  const brand = resolveTenantEmailBrand({
    preset: lookValues.preset,
    accentHue: lookValues.accentHue,
    logoHue: lookValues.logoHue,
  });

  const templates = Object.fromEntries(
    templateResults.map((result) => [
      result.templateType,
      {
        subject: result.subject,
        body: result.body,
        logoAssetUrl: result.logoAssetUrl,
      } satisfies TEmailTemplateEditorValues,
    ]),
  ) as Record<TEmailTemplateType, TEmailTemplateEditorValues>;

  return (
    <EmailForm
      tenantId={tenant.id}
      initialSettings={{
        senderName: emailConfig?.senderName ?? '',
        replyToAddress: emailConfig?.replyToAddress ?? '',
        footerPostalAddress: emailConfig?.footerPostalAddress ?? '',
        logoAssetUrl: emailConfig?.logoAssetUrl,
      }}
      templates={templates}
      brand={brand}
      brandName={tenant.name}
      archivedAt={tenant.deprovisionedAt ?? undefined}
    />
  );
};

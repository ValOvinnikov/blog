import {
  LOCALE_ISO_CODES,
  type TEmailTemplateType,
  type TLocaleIsoCode,
} from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE } from '@blog/db/constants';
import {
  emailTemplateLogos,
  emailTemplates,
  type TEmailTemplateBlock,
  type TEmailTemplateRow,
} from '@blog/db/schema/email-templates';
import { tenants } from '@blog/db/schema/tenants';
import { and, eq } from 'drizzle-orm';

export type TEmailTemplateResult = {
  tenantId: string;
  templateType: TEmailTemplateType;
  subject: string;
  body: TEmailTemplateBlock[];
  logoAssetUrl: string | undefined;
};

type TAuthoredEmailTemplateFields = Pick<
  TEmailTemplateRow,
  'locale' | 'subject' | 'body'
>;

// Subject and body each resolve on their own: the requested language's row,
// then the tenant's default-language row, then the product default in the
// requested language.
function mergeEmailTemplateCopy(
  tenantId: string,
  templateType: TEmailTemplateType,
  locale: TLocaleIsoCode,
  defaultLocale: TLocaleIsoCode,
  rows: TAuthoredEmailTemplateFields[],
  logoAssetUrl: string | undefined,
): TEmailTemplateResult {
  const defaults = EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE[locale][templateType];
  const requested = rows.find((row) => row.locale === locale);
  const fallback = rows.find((row) => row.locale === defaultLocale);

  return {
    tenantId,
    templateType,
    subject: requested?.subject ?? fallback?.subject ?? defaults.subject,
    body: requested?.body ?? fallback?.body ?? defaults.body,
    logoAssetUrl,
  };
}

export async function getEmailTemplate(
  tenantId: string,
  templateType: TEmailTemplateType,
  locale?: TLocaleIsoCode,
): Promise<TEmailTemplateResult> {
  const db = getDb();

  const [rows, [logo]] = await Promise.all([
    db
      .select({ defaultLocale: tenants.locale, template: emailTemplates })
      .from(tenants)
      .leftJoin(
        emailTemplates,
        and(
          eq(emailTemplates.tenantId, tenants.id),
          eq(emailTemplates.templateType, templateType),
        ),
      )
      .where(eq(tenants.id, tenantId)),
    db
      .select({ logoAssetUrl: emailTemplateLogos.logoAssetUrl })
      .from(emailTemplateLogos)
      .where(
        and(
          eq(emailTemplateLogos.tenantId, tenantId),
          eq(emailTemplateLogos.templateType, templateType),
        ),
      ),
  ]);

  const defaultLocale = rows[0]?.defaultLocale ?? LOCALE_ISO_CODES.EN;

  return mergeEmailTemplateCopy(
    tenantId,
    templateType,
    locale ?? defaultLocale,
    defaultLocale,
    rows.flatMap(({ template }) => (template ? [template] : [])),
    logo?.logoAssetUrl,
  );
}

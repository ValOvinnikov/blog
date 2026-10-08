import {
  EMAIL_TEMPLATE_TYPE,
  LOCALE_ISO_CODES,
  type TLocaleIsoCode,
} from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { emailTemplates } from '@blog/db/schema/email-templates';
import { tenants } from '@blog/db/schema/tenants';
import { eq } from 'drizzle-orm';

import {
  mergeEmailTemplateCopy,
  type TEmailTemplateResult,
} from '../get-email-template';

// A type with no authored row still appears, merged from defaults, so a
// settings screen can render a form per type unconditionally.
export async function listEmailTemplates(
  tenantId: string,
  locale?: TLocaleIsoCode,
): Promise<TEmailTemplateResult[]> {
  const db = getDb();

  const rows = await db
    .select({ defaultLocale: tenants.locale, template: emailTemplates })
    .from(tenants)
    .leftJoin(emailTemplates, eq(emailTemplates.tenantId, tenants.id))
    .where(eq(tenants.id, tenantId));

  const defaultLocale = rows[0]?.defaultLocale ?? LOCALE_ISO_CODES.EN;
  const templates = rows.flatMap(({ template }) =>
    template ? [template] : [],
  );

  return Object.values(EMAIL_TEMPLATE_TYPE).map((templateType) =>
    mergeEmailTemplateCopy(
      tenantId,
      templateType,
      locale ?? defaultLocale,
      defaultLocale,
      templates.filter((template) => template.templateType === templateType),
    ),
  );
}

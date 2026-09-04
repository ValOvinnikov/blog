import { EMAIL_TEMPLATE_TYPE } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { emailTemplates } from '@blog/db/schema/email-templates';
import { eq } from 'drizzle-orm';

import {
  mergeEmailTemplateCopy,
  type TEmailTemplateResult,
} from '../get-email-template';

/**
 * Every template type's effective copy for a tenant, one entry each — a
 * type with no authored row still appears, merged from defaults, so a
 * settings screen can render a form per type unconditionally.
 */
export async function listEmailTemplates(
  tenantId: string,
): Promise<TEmailTemplateResult[]> {
  const db = getDb();

  const rows = await db
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.tenantId, tenantId));

  const rowsByType = new Map(rows.map((row) => [row.templateType, row]));

  return Object.values(EMAIL_TEMPLATE_TYPE).map((templateType) =>
    mergeEmailTemplateCopy(
      tenantId,
      templateType,
      rowsByType.get(templateType),
    ),
  );
}

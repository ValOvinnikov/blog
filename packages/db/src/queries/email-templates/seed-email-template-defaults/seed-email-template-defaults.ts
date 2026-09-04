import { EMAIL_TEMPLATE_TYPE } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { EMAIL_TEMPLATE_DEFAULT_COPY } from '@blog/db/constants';
import { emailTemplates } from '@blog/db/schema/email-templates';

/**
 * Materializes one row per template type with the product default subject
 * and body, so a tenant's mail is complete before anyone edits anything.
 * Idempotent — never overwrites a row that already exists, whether from an
 * earlier seed run or a tenant's own edit, so it is safe to call again
 * during re-provisioning or from a one-off backfill.
 */
export async function seedEmailTemplateDefaults(
  tenantId: string,
): Promise<void> {
  const db = getDb();

  await db
    .insert(emailTemplates)
    .values(
      Object.values(EMAIL_TEMPLATE_TYPE).map((templateType) => ({
        tenantId,
        templateType,
        subject: EMAIL_TEMPLATE_DEFAULT_COPY[templateType].subject,
        body: EMAIL_TEMPLATE_DEFAULT_COPY[templateType].body,
      })),
    )
    .onConflictDoNothing({
      target: [emailTemplates.tenantId, emailTemplates.templateType],
    });
}

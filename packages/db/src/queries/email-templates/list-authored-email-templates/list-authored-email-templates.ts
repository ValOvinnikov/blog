import { getDb } from '@blog/db/client';
import {
  emailTemplates,
  type TEmailTemplateRow,
} from '@blog/db/schema/email-templates';
import { eq } from 'drizzle-orm';

export type TAuthoredEmailTemplateCopy = Pick<
  TEmailTemplateRow,
  'templateType' | 'locale' | 'subject' | 'body'
>;

// Unmerged: a field the tenant never wrote stays null, so an editor can tell
// authored copy from the fallback that would be sent instead.
export async function listAuthoredEmailTemplates(
  tenantId: string,
): Promise<TAuthoredEmailTemplateCopy[]> {
  return getDb()
    .select({
      templateType: emailTemplates.templateType,
      locale: emailTemplates.locale,
      subject: emailTemplates.subject,
      body: emailTemplates.body,
    })
    .from(emailTemplates)
    .where(eq(emailTemplates.tenantId, tenantId));
}

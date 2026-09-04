import type { TEmailTemplateType } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { EMAIL_TEMPLATE_DEFAULT_COPY } from '@blog/db/constants';
import {
  emailTemplates,
  type TPortableTextBlock,
} from '@blog/db/schema/email-templates';
import { and, eq } from 'drizzle-orm';

export type TEmailTemplateResult = {
  tenantId: string;
  templateType: TEmailTemplateType;
  subject: string;
  body: TPortableTextBlock[];
  logoAssetUrl: string | undefined;
};

type TAuthoredEmailTemplateFields = {
  subject: string | null;
  body: TPortableTextBlock[] | null;
  logoAssetUrl: string | null;
};

// Merges one authored row over its template type's product defaults, field
// by field — a row present but missing a field (or absent entirely) yields
// that field's default rather than an empty value. Shared by every read of
// template copy so the merge logic exists in exactly one place.
export function mergeEmailTemplateCopy(
  tenantId: string,
  templateType: TEmailTemplateType,
  row: TAuthoredEmailTemplateFields | undefined,
): TEmailTemplateResult {
  const defaults = EMAIL_TEMPLATE_DEFAULT_COPY[templateType];

  return {
    tenantId,
    templateType,
    subject: row?.subject ?? defaults.subject,
    body: row?.body ?? defaults.body,
    logoAssetUrl: row?.logoAssetUrl ?? undefined,
  };
}

export async function getEmailTemplate(
  tenantId: string,
  templateType: TEmailTemplateType,
): Promise<TEmailTemplateResult> {
  const db = getDb();

  const [row] = await db
    .select()
    .from(emailTemplates)
    .where(
      and(
        eq(emailTemplates.tenantId, tenantId),
        eq(emailTemplates.templateType, templateType),
      ),
    );

  return mergeEmailTemplateCopy(tenantId, templateType, row);
}

import type { TEmailTemplateType } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import {
  emailTemplates,
  type TPortableTextBlock,
} from '@blog/db/schema/email-templates';
import { z } from 'zod';

import {
  mergeEmailTemplateCopy,
  type TEmailTemplateResult,
} from '../get-email-template';

const SUBJECT_MAX = 200;

const portableTextBlockSchema = z
  .object({ _type: z.string(), _key: z.string() })
  .passthrough();

// A field absent from the input is left untouched on `UPDATE` (and falls
// back to the merge-with-defaults read path on the first `INSERT` for a
// tenant/template pair) — subject, body and logo save independently. An
// explicit `null` clears a previously-authored value back to the product
// default, distinct from omission.
export const updateEmailTemplateInputSchema = z.object({
  subject: z.string().trim().min(1).max(SUBJECT_MAX).nullable().optional(),
  body: z.array(portableTextBlockSchema).nullable().optional(),
  logoAssetUrl: z.string().trim().url().nullable().optional(),
});

export type TUpdateEmailTemplateInput = z.input<
  typeof updateEmailTemplateInputSchema
>;

type TEmailTemplateWritable = Partial<typeof emailTemplates.$inferInsert>;

function presentFields(
  parsed: z.output<typeof updateEmailTemplateInputSchema>,
): TEmailTemplateWritable {
  const fields: TEmailTemplateWritable = {};

  if (parsed.subject !== undefined) fields.subject = parsed.subject;
  if (parsed.body !== undefined) {
    fields.body = parsed.body as TPortableTextBlock[] | null;
  }
  if (parsed.logoAssetUrl !== undefined) {
    fields.logoAssetUrl = parsed.logoAssetUrl;
  }

  return fields;
}

export async function upsertEmailTemplate(
  tenantId: string,
  templateType: TEmailTemplateType,
  input: TUpdateEmailTemplateInput,
): Promise<TEmailTemplateResult> {
  const db = getDb();
  const parsed = updateEmailTemplateInputSchema.parse(input);
  const fields = presentFields(parsed);

  const [row] = await db
    .insert(emailTemplates)
    .values({ tenantId, templateType, ...fields })
    .onConflictDoUpdate({
      target: [emailTemplates.tenantId, emailTemplates.templateType],
      set: { ...fields, updatedAt: new Date() },
    })
    .returning();

  if (!row) {
    throw new Error(
      `upsertEmailTemplate: upsert for tenant "${tenantId}" template "${templateType}" returned no row.`,
    );
  }

  return mergeEmailTemplateCopy(tenantId, templateType, row);
}

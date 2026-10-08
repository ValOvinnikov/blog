import type {
  TEmailTemplateType,
  TLocaleIsoCode,
} from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import {
  emailTemplates,
  type TEmailTemplateBlock,
} from '@blog/db/schema/email-templates';
import { tenants } from '@blog/db/schema/tenants';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import {
  getEmailTemplate,
  type TEmailTemplateResult,
} from '../get-email-template';

const SUBJECT_MAX = 200;

const portableTextBlockSchema = z
  .object({ _type: z.string(), _key: z.string() })
  .passthrough();

// An omitted field is left untouched, so subject, body and logo save
// independently; an explicit `null` clears the field back to its fallback.
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
    fields.body = parsed.body as TEmailTemplateBlock[] | null;
  }
  if (parsed.logoAssetUrl !== undefined) {
    fields.logoAssetUrl = parsed.logoAssetUrl;
  }

  return fields;
}

async function resolveTenantLocale(tenantId: string): Promise<TLocaleIsoCode> {
  const [tenant] = await getDb()
    .select({ locale: tenants.locale })
    .from(tenants)
    .where(eq(tenants.id, tenantId));

  if (!tenant) {
    throw new Error(
      `upsertEmailTemplate: tenant "${tenantId}" does not exist.`,
    );
  }

  return tenant.locale;
}

export async function upsertEmailTemplate(
  tenantId: string,
  templateType: TEmailTemplateType,
  input: TUpdateEmailTemplateInput,
  locale?: TLocaleIsoCode,
): Promise<TEmailTemplateResult> {
  const db = getDb();
  const parsed = updateEmailTemplateInputSchema.parse(input);
  const fields = presentFields(parsed);
  const targetLocale = locale ?? (await resolveTenantLocale(tenantId));

  const [row] = await db
    .insert(emailTemplates)
    .values({ tenantId, templateType, locale: targetLocale, ...fields })
    .onConflictDoUpdate({
      target: [
        emailTemplates.tenantId,
        emailTemplates.templateType,
        emailTemplates.locale,
      ],
      set: { ...fields, updatedAt: new Date() },
    })
    .returning();

  if (!row) {
    throw new Error(
      `upsertEmailTemplate: upsert for tenant "${tenantId}" template "${templateType}" returned no row.`,
    );
  }

  return getEmailTemplate(tenantId, templateType, targetLocale);
}

import type {
  TEmailTemplateType,
  TLocaleIsoCode,
} from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import {
  emailTemplateLogos,
  emailTemplates,
  type TEmailTemplateBlock,
} from '@blog/db/schema/email-templates';
import { tenants } from '@blog/db/schema/tenants';
import { and, eq } from 'drizzle-orm';
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

type TEmailTemplateCopyWritable = Partial<
  Pick<typeof emailTemplates.$inferInsert, 'subject' | 'body'>
>;

function presentCopyFields(
  parsed: z.output<typeof updateEmailTemplateInputSchema>,
): TEmailTemplateCopyWritable {
  const fields: TEmailTemplateCopyWritable = {};

  if (parsed.subject !== undefined) fields.subject = parsed.subject;
  if (parsed.body !== undefined) {
    fields.body = parsed.body as TEmailTemplateBlock[] | null;
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

async function writeCopy(
  tenantId: string,
  templateType: TEmailTemplateType,
  locale: TLocaleIsoCode,
  fields: TEmailTemplateCopyWritable,
): Promise<void> {
  const [row] = await getDb()
    .insert(emailTemplates)
    .values({ tenantId, templateType, locale, ...fields })
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
}

async function writeLogo(
  tenantId: string,
  templateType: TEmailTemplateType,
  logoAssetUrl: string | null,
): Promise<void> {
  const db = getDb();

  if (logoAssetUrl === null) {
    await db
      .delete(emailTemplateLogos)
      .where(
        and(
          eq(emailTemplateLogos.tenantId, tenantId),
          eq(emailTemplateLogos.templateType, templateType),
        ),
      );
    return;
  }

  await db
    .insert(emailTemplateLogos)
    .values({ tenantId, templateType, logoAssetUrl })
    .onConflictDoUpdate({
      target: [emailTemplateLogos.tenantId, emailTemplateLogos.templateType],
      set: { logoAssetUrl, updatedAt: new Date() },
    });
}

// The logo is the same in every language, so `locale` scopes only the
// subject and body.
export async function upsertEmailTemplate(
  tenantId: string,
  templateType: TEmailTemplateType,
  input: TUpdateEmailTemplateInput,
  locale?: TLocaleIsoCode,
): Promise<TEmailTemplateResult> {
  const parsed = updateEmailTemplateInputSchema.parse(input);
  const copyFields = presentCopyFields(parsed);
  const targetLocale = locale ?? (await resolveTenantLocale(tenantId));

  if (Object.keys(copyFields).length > 0) {
    await writeCopy(tenantId, templateType, targetLocale, copyFields);
  }
  if (parsed.logoAssetUrl !== undefined) {
    await writeLogo(tenantId, templateType, parsed.logoAssetUrl);
  }

  return getEmailTemplate(tenantId, templateType, targetLocale);
}

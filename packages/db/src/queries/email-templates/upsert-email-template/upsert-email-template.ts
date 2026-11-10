import {
  SUBJECT_MAX,
  type TEmailTemplateType,
  type TLocaleIsoCode,
} from '@blog/config/constants';
import type { TMaybeNull } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import {
  emailTemplateLogos,
  emailTemplates,
  type TEmailTemplateBlock,
} from '@blog/db/schema/email-templates';
import { tenants } from '@blog/db/schema/tenants';
import { hasLength, isNull, isUndefined } from '@blog/utils/primitives';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import {
  getEmailTemplate,
  type TEmailTemplateResult,
} from '../get-email-template';

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

  if (!isUndefined(parsed.subject)) fields.subject = parsed.subject;
  if (!isUndefined(parsed.body)) {
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
  logoAssetUrl: TMaybeNull<string>,
): Promise<void> {
  const db = getDb();

  if (isNull(logoAssetUrl)) {
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

  if (hasLength(Object.keys(copyFields))) {
    await writeCopy(tenantId, templateType, targetLocale, copyFields);
  }
  if (!isUndefined(parsed.logoAssetUrl)) {
    await writeLogo(tenantId, templateType, parsed.logoAssetUrl);
  }

  return getEmailTemplate(tenantId, templateType, targetLocale);
}

'use server';

import {
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  EMAIL_TEMPLATE_TYPE,
  type TEmailTemplateType,
} from '@blog/config';
import { queries } from '@blog/db';
import type { TEmailTemplateResult } from '@blog/db/queries/email-templates';
import { sanitizeHref } from '@blog/email/html';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { logger } from '@platform/utils/logger/logger';
import { z } from 'zod';

const SUBJECT_MAX = 200;

const EMAIL_TEMPLATE_TYPE_VALUES = Object.values(EMAIL_TEMPLATE_TYPE) as [
  TEmailTemplateType,
  ...TEmailTemplateType[],
];

const portableTextBlockSchema = z
  .object({ _type: z.string(), _key: z.string() })
  .passthrough();

type TLooseMarkDef = { _type?: unknown; href?: unknown };
type TLooseBlock = { markDefs?: unknown };

// The Server Action is directly callable regardless of what the client
// renders, so every `link` markDef's `href` is re-checked here against the
// same allowlist `@blog/email` applies to its own link rendering.
const hasOnlySafeLinkHrefs = (
  body: z.infer<typeof portableTextBlockSchema>[] | null,
): boolean => {
  if (!body) return true;

  return body.every((block) => {
    const markDefs = Array.isArray((block as TLooseBlock).markDefs)
      ? ((block as TLooseBlock).markDefs as unknown[])
      : [];

    return markDefs.every((markDef) => {
      if (typeof markDef !== 'object' || markDef === null) return true;
      const { _type, href } = markDef as TLooseMarkDef;
      if (_type !== 'link') return true;
      return typeof href === 'string' && sanitizeHref(href) !== null;
    });
  });
};

// Blank means "revert to the product default" for both fields — the client
// sends `null`, never an empty string or an empty block array, when the
// tenant has cleared their authored copy. `.min(1)` on the subject's string
// branch is what makes an accidental empty string a validation failure
// rather than a silently-stored blank.
const updateEmailTemplateInputSchema = z
  .object({
    subject: z.string().trim().min(1).max(SUBJECT_MAX).nullable(),
    body: z.array(portableTextBlockSchema).min(1).nullable(),
  })
  .refine((input) => hasOnlySafeLinkHrefs(input.body), {
    message: 'Body contains an unsupported link URL.',
    path: ['body'],
  });

export type TUpdateEmailTemplateInput = z.input<
  typeof updateEmailTemplateInputSchema
>;
export type TUpdateEmailTemplateResult =
  { ok: true; result: TEmailTemplateResult } | { ok: false };

/**
 * The per-template copy editor's save action — subject and body only. The
 * template's logo persists immediately through its own
 * `uploadEmailLogoAction`/`clearEmailLogoAction`, the same immediate-persist
 * pattern the Look tab's brand-asset fields use, so it never goes through
 * this action.
 */
export const updateEmailTemplateAction = async (
  tenantId: string,
  templateType: TEmailTemplateType,
  input: TUpdateEmailTemplateInput,
): Promise<TUpdateEmailTemplateResult> => {
  const parsedTemplateType = z
    .enum(EMAIL_TEMPLATE_TYPE_VALUES)
    .safeParse(templateType);
  const parsedInput = updateEmailTemplateInputSchema.safeParse(input);
  if (!parsedTemplateType.success || !parsedInput.success) {
    return { ok: false };
  }

  const { tenant } = await requireTenantMembership(tenantId);

  try {
    const result = await queries.emailTemplates.upsertEmailTemplate(
      tenant.id,
      parsedTemplateType.data,
      parsedInput.data,
    );
    await recordAuditEvent({
      logEvent: 'email_templates.update_audit_failed',
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: tenant.id,
      details: { templateType: parsedTemplateType.data },
    });
    return { ok: true, result };
  } catch (error) {
    logger.error('email_templates.update_failed', {
      tenantId: tenant.id,
      templateType: parsedTemplateType.data,
      error,
    });
    return { ok: false };
  }
};

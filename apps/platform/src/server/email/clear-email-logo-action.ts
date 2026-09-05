'use server';

import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import { queries } from '@blog/db';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import {
  emailLogoTargetSchema,
  type TEmailLogoTarget,
} from '@platform/utils/email-logo-target/email-logo-target';
import { env } from '@platform/utils/env/env';
import { logger } from '@platform/utils/logger/logger';
import { del } from '@vercel/blob';

export type TClearEmailLogoResult = { ok: true } | { ok: false; error: string };

const getCurrentLogoUrl = async (
  tenantId: string,
  target: TEmailLogoTarget,
): Promise<string | undefined> => {
  if (target.type === 'tenant') {
    const config = await queries.emailConfig.getEmailConfig(tenantId);
    return config?.logoAssetUrl;
  }

  const template = await queries.emailTemplates.getEmailTemplate(
    tenantId,
    target.templateType,
  );
  return template.logoAssetUrl;
};

/**
 * Clears the target's stored logo URL; a no-op success if it is already empty.
 */
export const clearEmailLogoAction = async (
  tenantId: string,
  target: TEmailLogoTarget,
): Promise<TClearEmailLogoResult> => {
  const { tenant } = await requireTenantMembership(tenantId);

  const parsedTarget = emailLogoTargetSchema.safeParse(target);
  if (!parsedTarget.success) {
    return { ok: false, error: 'Unrecognized upload target.' };
  }

  try {
    const previousUrl = await getCurrentLogoUrl(tenant.id, parsedTarget.data);
    if (!previousUrl) return { ok: true };

    if (parsedTarget.data.type === 'tenant') {
      await queries.emailConfig.upsertEmailConfig(tenant.id, {
        logoAssetUrl: null,
      });
    } else {
      await queries.emailTemplates.upsertEmailTemplate(
        tenant.id,
        parsedTarget.data.templateType,
        { logoAssetUrl: null },
      );
    }

    if (env.BLOB_READ_WRITE_TOKEN) {
      try {
        await del(previousUrl, { token: env.BLOB_READ_WRITE_TOKEN });
      } catch (error) {
        logger.error('email_logo.delete_failed', {
          tenantId: tenant.id,
          target: parsedTarget.data,
          error,
        });
      }
    }

    await recordAuditEvent({
      logEvent: 'email_logo.clear_audit_failed',
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: tenant.id,
      details: { target: parsedTarget.data, operation: 'clear' },
    });

    return { ok: true };
  } catch (error) {
    logger.error('email_logo.clear_failed', {
      tenantId: tenant.id,
      target: parsedTarget.data,
      error,
    });
    return { ok: false, error: "Couldn't remove the logo — try again." };
  }
};

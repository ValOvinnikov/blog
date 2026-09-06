import type { TEmailTemplateType } from '@blog/config/constants';
import { queries } from '@blog/db';
import { isValidEmailAddress } from '@blog/email/validation';

export type TResolvedMagicLinkEmailSettings = {
  logoImageUrl: string | undefined;
  senderName: string | undefined;
  replyTo: string | undefined;
  footerPostalAddress: string | undefined;
};

/**
 * Resolves a tenant's `email_config` settings and its `templateType` logo,
 * best-effort — each underlying lookup degrades to product defaults on its
 * own rather than failing the other, so a settings-load error never blocks
 * delivery of the magic-link email itself. A malformed stored reply-to
 * address is dropped rather than passed through, since `sendEmail` throws
 * on one.
 */
export async function resolveMagicLinkEmailSettings(
  tenantId: string,
  templateType: TEmailTemplateType,
): Promise<TResolvedMagicLinkEmailSettings> {
  const [config, template] = await Promise.all([
    getEmailConfigSafely(tenantId),
    getEmailTemplateSafely(tenantId, templateType),
  ]);

  const replyTo = config?.replyToAddress;

  return {
    logoImageUrl: template?.logoAssetUrl ?? config?.logoAssetUrl,
    senderName: config?.senderName,
    replyTo: replyTo && isValidEmailAddress(replyTo) ? replyTo : undefined,
    footerPostalAddress: config?.footerPostalAddress,
  };
}

async function getEmailConfigSafely(tenantId: string) {
  try {
    return await queries.emailConfig.getEmailConfig(tenantId);
  } catch {
    return undefined;
  }
}

async function getEmailTemplateSafely(
  tenantId: string,
  templateType: TEmailTemplateType,
) {
  try {
    return await queries.emailTemplates.getEmailTemplate(
      tenantId,
      templateType,
    );
  } catch {
    return undefined;
  }
}

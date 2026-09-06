import { EMAIL_TEMPLATE_TYPE } from '@blog/config/constants';
import { EMAIL_TEMPLATE_DEFAULT_COPY, queries } from '@blog/db';
import { isValidEmailAddress, type TPortableTextContent } from '@blog/email';
import { resolveNewsletterFromAddress } from '@web/server/newsletter/newsletter-from-address';
import { logger } from '@web/utils/logger/logger';

export type TNewsletterEmailSettings = {
  subject: string;
  body: TPortableTextContent;
  logoImageUrl: string | undefined;
  footerPostalAddress: string | undefined;
  fromAddress: string;
  replyTo: string | undefined;
};

// Header-injection guard: a `from` display name flows straight into a mail
// header, so stray CR/LF and angle brackets in a tenant-supplied sender name
// must never reach it verbatim — matches
// packages/auth/src/providers/magic-link/apply-tenant-sender-name.ts.
const sanitizeSenderName = (senderName: string): string =>
  senderName.replace(/[\r\n<>]/g, '').trim();

const FROM_ADDRESS_WITH_DISPLAY_NAME = /<([^<>]+)>\s*$/;

const applySenderNameOverride = (
  fromAddress: string,
  senderName: string | undefined,
): string => {
  if (!senderName) return fromAddress;

  const sanitizedSenderName = sanitizeSenderName(senderName);
  if (!sanitizedSenderName) return fromAddress;

  const match = fromAddress.match(FROM_ADDRESS_WITH_DISPLAY_NAME);
  const address = (match?.[1] ?? fromAddress).trim();

  return `${sanitizedSenderName} <${address}>`;
};

const getEmailConfigSafely = async (tenantId: string) => {
  try {
    return await queries.emailConfig.getEmailConfig(tenantId);
  } catch (error) {
    logger.warn('newsletter_email_settings.email_config_fetch_failed', {
      tenantId,
      error,
    });
    return undefined;
  }
};

const getEmailTemplateSafely = async (tenantId: string) => {
  try {
    return await queries.emailTemplates.getEmailTemplate(
      tenantId,
      EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION,
    );
  } catch (error) {
    logger.warn('newsletter_email_settings.email_template_fetch_failed', {
      tenantId,
      error,
    });
    return undefined;
  }
};

/**
 * Resolves the tenant-configurable parts of a newsletter confirmation send —
 * authored subject/body, logo, sender display name, reply-to and footer
 * postal address — layering `email_config` under the per-template row and
 * falling back to product defaults on any settings-load failure so a broken
 * query never blocks delivery.
 */
export const resolveNewsletterEmailSettings = async (
  tenantId: string,
  configuredFromAddress: string | undefined,
): Promise<TNewsletterEmailSettings> => {
  const [emailConfig, template] = await Promise.all([
    getEmailConfigSafely(tenantId),
    getEmailTemplateSafely(tenantId),
  ]);

  const defaultCopy =
    EMAIL_TEMPLATE_DEFAULT_COPY[EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION];

  const replyToAddress = emailConfig?.replyToAddress;
  const replyTo =
    replyToAddress && isValidEmailAddress(replyToAddress)
      ? replyToAddress
      : undefined;

  if (replyToAddress && !replyTo) {
    logger.warn('newsletter_email_settings.reply_to_invalid', { tenantId });
  }

  return {
    subject: template?.subject ?? defaultCopy.subject,
    body: template?.body ?? defaultCopy.body,
    logoImageUrl: template?.logoAssetUrl ?? emailConfig?.logoAssetUrl,
    footerPostalAddress: emailConfig?.footerPostalAddress,
    fromAddress: applySenderNameOverride(
      resolveNewsletterFromAddress(configuredFromAddress),
      emailConfig?.senderName,
    ),
    replyTo,
  };
};

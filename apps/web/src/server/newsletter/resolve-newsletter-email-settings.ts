import { EMAIL_TEMPLATE_TYPE } from '@blog/config/constants';
import { queries } from '@blog/db';
import { isValidEmailAddress } from '@blog/email';
import { resolveNewsletterFromAddress } from '@web/server/newsletter/newsletter-from-address';
import { logger } from '@web/utils/logger/logger';

export type TNewsletterEmailSettings = {
  logoImageUrl: string | undefined;
  footerPostalAddress: string | undefined;
  fromAddress: string;
  replyTo: string | undefined;
};

// Header-injection guard: a `from`/`replyTo` display name flows straight
// into a mail header, so a stray CR/LF in a tenant-supplied sender name
// must never reach it verbatim.
const sanitizeSenderName = (senderName: string): string =>
  senderName.replace(/[\r\n]+/g, ' ').trim();

const FROM_ADDRESS_WITH_DISPLAY_NAME = /<([^<>]+)>\s*$/;

const applySenderNameOverride = (
  fromAddress: string,
  senderName: string | undefined,
): string => {
  if (!senderName) return fromAddress;

  const match = fromAddress.match(FROM_ADDRESS_WITH_DISPLAY_NAME);
  const address = (match?.[1] ?? fromAddress).trim();

  return `${sanitizeSenderName(senderName)} <${address}>`;
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

const getEmailTemplateLogoSafely = async (
  tenantId: string,
): Promise<string | undefined> => {
  try {
    const template = await queries.emailTemplates.getEmailTemplate(
      tenantId,
      EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION,
    );
    return template.logoAssetUrl;
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
 * logo, sender display name, reply-to and footer postal address — layering
 * `email_config` under the per-template logo and falling back to product
 * defaults on any settings-load failure so a broken query never blocks
 * delivery.
 */
export const resolveNewsletterEmailSettings = async (
  tenantId: string,
  configuredFromAddress: string | undefined,
): Promise<TNewsletterEmailSettings> => {
  const [emailConfig, templateLogoImageUrl] = await Promise.all([
    getEmailConfigSafely(tenantId),
    getEmailTemplateLogoSafely(tenantId),
  ]);

  const replyToAddress = emailConfig?.replyToAddress;
  const replyTo =
    replyToAddress && isValidEmailAddress(replyToAddress)
      ? replyToAddress
      : undefined;

  if (replyToAddress && !replyTo) {
    logger.warn('newsletter_email_settings.reply_to_invalid', { tenantId });
  }

  return {
    logoImageUrl: templateLogoImageUrl ?? emailConfig?.logoAssetUrl,
    footerPostalAddress: emailConfig?.footerPostalAddress,
    fromAddress: applySenderNameOverride(
      resolveNewsletterFromAddress(configuredFromAddress),
      emailConfig?.senderName,
    ),
    replyTo,
  };
};

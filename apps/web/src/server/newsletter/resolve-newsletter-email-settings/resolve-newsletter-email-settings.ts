import type { TMaybeUndefined } from '@blog/config';
import {
  EMAIL_TEMPLATE_TYPE,
  LOCALE_ISO_CODES,
  type TLocaleIsoCode,
} from '@blog/config/constants';
import { EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE, queries } from '@blog/db';
import { isValidEmailAddress, type TPortableTextContent } from '@blog/email';
import { resolveNewsletterFromAddress } from '@web/server/newsletter/newsletter-from-address/newsletter-from-address';
import { logger } from '@web/utils/logger/logger';

export type TNewsletterEmailSettings = {
  subject: string;
  body: TPortableTextContent;
  logoImageUrl: TMaybeUndefined<string>;
  footerPostalAddress: TMaybeUndefined<string>;
  fromAddress: string;
  replyTo: TMaybeUndefined<string>;
};

// A `from` display name flows straight into a mail header.
const sanitizeSenderName = (senderName: string): string =>
  senderName.replace(/[\r\n<>]/g, '').trim();

const FROM_ADDRESS_WITH_DISPLAY_NAME = /<([^<>]+)>\s*$/;

const applySenderNameOverride = (
  fromAddress: string,
  senderName: TMaybeUndefined<string>,
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

const getEmailTemplateSafely = async (
  tenantId: string,
  locale: TMaybeUndefined<TLocaleIsoCode>,
) => {
  try {
    return await queries.emailTemplates.getEmailTemplate(
      tenantId,
      EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION,
      locale,
    );
  } catch (error) {
    logger.warn('newsletter_email_settings.email_template_fetch_failed', {
      tenantId,
      error,
    });
    return undefined;
  }
};

export const resolveNewsletterEmailSettings = async (
  tenantId: string,
  configuredFromAddress: TMaybeUndefined<string>,
  locale: TMaybeUndefined<TLocaleIsoCode>,
): Promise<TNewsletterEmailSettings> => {
  const [emailConfig, template] = await Promise.all([
    getEmailConfigSafely(tenantId),
    getEmailTemplateSafely(tenantId, locale),
  ]);

  const defaultCopy =
    EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE[locale ?? LOCALE_ISO_CODES.EN][
      EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION
    ];

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

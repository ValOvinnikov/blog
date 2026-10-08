import {
  EMAIL_TEMPLATE_TYPE,
  isLocaleIsoCode,
  LOCALE_ISO_CODES,
  type TLocaleIsoCode,
} from '@blog/config/constants';
import { EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE, queries } from '@blog/db';
import { isValidEmailAddress, type TPortableTextContent } from '@blog/email';
import { resolveNewsletterFromAddress } from '@web/server/newsletter/newsletter-from-address/newsletter-from-address';
import { logger } from '@web/utils/logger/logger';
import { getLocale } from 'next-intl/server';

export type TNewsletterEmailSettings = {
  subject: string;
  body: TPortableTextContent;
  logoImageUrl: string | undefined;
  footerPostalAddress: string | undefined;
  fromAddress: string;
  replyTo: string | undefined;
};

// A `from` display name flows straight into a mail header.
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

const getEmailTemplateSafely = async (
  tenantId: string,
  locale: TLocaleIsoCode | undefined,
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

const getSubscribedPageLocale = async (): Promise<
  TLocaleIsoCode | undefined
> => {
  const locale = await getLocale();
  return isLocaleIsoCode(locale) ? locale : undefined;
};

export const resolveNewsletterEmailSettings = async (
  tenantId: string,
  configuredFromAddress: string | undefined,
): Promise<TNewsletterEmailSettings> => {
  const locale = await getSubscribedPageLocale();
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

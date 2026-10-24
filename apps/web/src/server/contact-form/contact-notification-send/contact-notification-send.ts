import { queries } from '@blog/db';
import { buildContactNotificationEmail, sendEmail } from '@blog/email';
import { resolveNewsletterFromAddress } from '@web/server/newsletter/newsletter-from-address/newsletter-from-address';
import { getTenantBaseUrl } from '@web/server/tenant/tenant-base-url/tenant-base-url';
import { env } from '@web/utils/env/env';
import { logger } from '@web/utils/logger/logger';
import { resolveTenantEmailIdentity } from '@web/utils/resolve-tenant-email-identity';

const PLATFORM_LEADS_PATH = '/dashboard/leads';

const resolveLeadsUrl = (): string => {
  const { PLATFORM_APP_URL: platformUrl } = env;
  if (!platformUrl) {
    logger.warn('contact_form.platform_url_missing');
    return PLATFORM_LEADS_PATH;
  }
  return `${platformUrl.replace(/\/$/, '')}${PLATFORM_LEADS_PATH}`;
};

export const sendContactNotification = async ({
  tenantId,
  name,
  email,
  message,
  sourcePath,
}: queries.leads.TCreateLeadInput): Promise<void> => {
  const [recipient, emailConfig, identity, siteUrl] = await Promise.all([
    queries.emailConfig.getContactRecipient(tenantId),
    queries.emailConfig.getEmailConfig(tenantId),
    resolveTenantEmailIdentity(tenantId),
    getTenantBaseUrl(),
  ]);

  if (!recipient) {
    throw new Error(`Tenant "${tenantId}" has no contact recipient.`);
  }

  const { subject, html } = buildContactNotificationEmail({
    siteName: identity.brandName,
    visitorName: name,
    visitorEmail: email,
    message,
    pageUrl: `${siteUrl ?? ''}${sourcePath}`,
    leadsUrl: resolveLeadsUrl(),
    brand: identity.brand,
    logoImageUrl: emailConfig?.logoAssetUrl ?? undefined,
    footerPostalAddress: emailConfig?.footerPostalAddress ?? undefined,
  });

  await sendEmail({
    to: recipient,
    from: resolveNewsletterFromAddress(env.NEWSLETTER_FROM_ADDRESS),
    subject,
    html,
    replyTo: email,
  });
};

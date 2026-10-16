import { routes } from '@blog/config';
import { queries, type schema } from '@blog/db';
import { buildNewsletterConfirmationEmail, sendEmail } from '@blog/email';
import { resolveNewsletterEmailSettings } from '@web/server/newsletter/resolve-newsletter-email-settings/resolve-newsletter-email-settings';
import { getSubscribedPageLocale } from '@web/server/newsletter/subscribed-page-locale/subscribed-page-locale';
import { getTenantBaseUrl } from '@web/server/tenant/tenant-base-url/tenant-base-url';
import { env } from '@web/utils/env/env';
import { resolveTenantEmailIdentity } from '@web/utils/resolve-tenant-email-identity';

const CONFIRMATION_RESEND_COOLDOWN_MS = 15 * 60_000;

const sendConfirmationEmail = async (
  tenantId: string,
  { email, confirmationToken, unsubscribeToken }: schema.TSubscriber,
): Promise<void> => {
  const siteUrl = (await getTenantBaseUrl()) ?? '';
  const locale = await getSubscribedPageLocale();
  const confirmationUrl = `${siteUrl}${routes.newsletterConfirm(confirmationToken, locale)}`;
  const unsubscribeUrl = `${siteUrl}${routes.newsletterUnsubscribe(unsubscribeToken, locale)}`;
  const { brand, brandName } = await resolveTenantEmailIdentity(tenantId);

  const {
    subject,
    body,
    logoImageUrl,
    footerPostalAddress,
    fromAddress,
    replyTo,
  } = await resolveNewsletterEmailSettings(
    tenantId,
    env.NEWSLETTER_FROM_ADDRESS,
    locale,
  );

  const { html, headers } = buildNewsletterConfirmationEmail({
    subject,
    body,
    confirmationUrl,
    unsubscribeUrl,
    brand,
    brandName,
    logoImageUrl,
    footerPostalAddress,
  });

  await sendEmail({
    to: email,
    from: fromAddress,
    subject,
    html,
    headers,
    replyTo,
  });
};

export const sendNewsletterConfirmation = async (
  tenantId: string,
  subscriber: schema.TSubscriber,
): Promise<void> => {
  const claimedAt = await queries.subscribers.claimConfirmationSend(
    subscriber.id,
    CONFIRMATION_RESEND_COOLDOWN_MS,
  );
  if (!claimedAt) return;

  try {
    await sendConfirmationEmail(tenantId, subscriber);
  } catch (error) {
    await queries.subscribers.releaseConfirmationSend(subscriber.id, claimedAt);
    throw error;
  }
};

import { resolveTenantEmailBrand } from '@blog/config';
import type { TLocaleIsoCode } from '@blog/config/constants';
import type { TMaybeUndefined } from '@blog/config/types';
import { getEmailConfig } from '@blog/db/queries/email-config';
import { getSiteConfig } from '@blog/db/queries/site-config';
import {
  applyTenantSenderName,
  isValidEmailAddress,
  type TTenantEmailBrand,
} from '@blog/email';
import { DEFAULT_NEWSLETTER_FROM_ADDRESS } from '@worker/constants/newsletter-send';
import { loadTenant } from '@worker/units/run-reported-step';
import { env } from '@worker/utils/env/env';
import { tenantSiteUrl } from '@worker/utils/owner-email/owner-email-context';
import { FatalError } from 'workflow';

export type TNewsletterSendContext = {
  siteUrl: string;
  locale: TLocaleIsoCode;
  from: string;
  replyTo: TMaybeUndefined<string>;
  brand: TTenantEmailBrand;
  brandName: string;
  logoImageUrl: TMaybeUndefined<string>;
  footerPostalAddress: TMaybeUndefined<string>;
  unsubscribeKey: string;
};

export async function loadNewsletterSendContext(
  tenantId: string,
): Promise<TNewsletterSendContext> {
  const unsubscribeKey = env.NEWSLETTER_UNSUBSCRIBE_KEY;
  if (!unsubscribeKey) {
    throw new FatalError('NEWSLETTER_UNSUBSCRIBE_KEY is not set.');
  }

  const [tenant, siteConfig, emailConfig] = await Promise.all([
    loadTenant(tenantId),
    getSiteConfig(tenantId),
    getEmailConfig(tenantId),
  ]);
  if (!siteConfig) {
    throw new FatalError(`Tenant "${tenantId}" has no site config.`);
  }
  const { name, locale } = tenant;
  const { preset, accentHue, logoHue } = siteConfig;
  const replyToAddress = emailConfig?.replyToAddress;

  return {
    siteUrl: tenantSiteUrl(tenant),
    locale,
    from: applyTenantSenderName(
      env.NEWSLETTER_FROM_ADDRESS ?? DEFAULT_NEWSLETTER_FROM_ADDRESS,
      emailConfig?.senderName ?? name,
    ),
    replyTo:
      replyToAddress && isValidEmailAddress(replyToAddress)
        ? replyToAddress
        : undefined,
    brand: resolveTenantEmailBrand({ preset, accentHue, logoHue }),
    brandName: name,
    logoImageUrl: emailConfig?.logoAssetUrl,
    footerPostalAddress: emailConfig?.footerPostalAddress,
    unsubscribeKey,
  };
}

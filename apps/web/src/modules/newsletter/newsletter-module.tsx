import { CAPABILITY } from '@blog/config';
import { service } from '@blog/service';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { logger } from '@web/utils/logger/logger';

import { NewsletterModuleView } from './newsletter-module-view';

export interface INewsletterModuleProps {
  id: string;
  locale: string;
  tenant: string;
}

export const NewsletterModule = async ({
  id,
  tenant,
}: INewsletterModuleProps) => {
  const isEnabled = await isCapabilityEnabled(CAPABILITY.NEWSLETTER, tenant);
  if (!isEnabled) return null;

  const tenantContext = await getTenantSanityContext(tenant);
  const [result, newsletterSettingsResult] = await Promise.all([
    service.modules.newsletter.v1.getNewsletter(id, tenantContext),
    service.global.newsletterSettings.v1.getNewsletterSettings(tenantContext),
  ]);

  if (!result.ok) {
    logger.error('newsletter_module.fetch_failed', {
      id,
      error: result.error,
    });
    return null;
  }

  if (!newsletterSettingsResult.ok) {
    logger.error('newsletter_module.newsletter_settings_fetch_failed', {
      error: newsletterSettingsResult.error,
    });
  }
  const trustCues = newsletterSettingsResult.ok
    ? newsletterSettingsResult.data.trustCues
    : undefined;

  return (
    <NewsletterModuleView id={id} {...result.data} trustCues={trustCues} />
  );
};

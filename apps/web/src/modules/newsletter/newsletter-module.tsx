import { CAPABILITY } from '@blog/config';
import { service } from '@blog/service';
import { getRequestContext } from '@web/server/request-context/request-context';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled';
import { logger } from '@web/utils/logger/logger';

import { NewsletterModuleView } from './newsletter-module-view';

export interface INewsletterModuleProps {
  id: string;
}

export const NewsletterModule = async ({ id }: INewsletterModuleProps) => {
  const { sanityContext } = await getRequestContext();
  const isEnabled = await isCapabilityEnabled(CAPABILITY.NEWSLETTER);
  if (!isEnabled) return null;

  const [result, newsletterSettingsResult] = await Promise.all([
    service.modules.newsletter.v1.getNewsletter(id, sanityContext),
    service.global.newsletterSettings.v1.getNewsletterSettings(sanityContext),
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

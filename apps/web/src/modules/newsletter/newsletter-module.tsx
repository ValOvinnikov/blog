import { CAPABILITY } from '@blog/config';
import { service } from '@blog/service';
import { getRequestContext } from '@web/server/request-context/request-context';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled/is-capability-enabled';
import { logger } from '@web/utils/logger/logger';

import { NewsletterModuleView } from './newsletter-module-view';

export interface INewsletterModuleProps {
  id: string;
}

export const NewsletterModule = async ({ id }: INewsletterModuleProps) => {
  const { sanityContext } = await getRequestContext();
  const isEnabled = await isCapabilityEnabled(CAPABILITY.NEWSLETTER);
  if (!isEnabled) return null;

  const result = await service.modules.newsletter.v1.getNewsletter(
    id,
    sanityContext,
  );

  if (!result.ok) {
    logger.error('newsletter_module.fetch_failed', {
      id,
      error: result.error,
    });
    return null;
  }

  return <NewsletterModuleView id={id} {...result.data} />;
};

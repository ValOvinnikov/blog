import { CAPABILITY } from '@blog/config';
import { service } from '@blog/service';
import { NEWSLETTER_LOG } from '@web/constants/newsletter';
import { getRequestContext } from '@web/server/request-context/request-context';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled/is-capability-enabled';
import { isRequestTenantActive } from '@web/server/tenant/write-gate/write-gate';
import { logger } from '@web/utils/logger/logger';

import { NewsletterModuleView } from './newsletter-module-view';

export interface INewsletterModuleProps {
  id: string;
}

export const NewsletterModule = async ({ id }: INewsletterModuleProps) => {
  const { sanityContext } = await getRequestContext();
  const [isEnabled, isActive] = await Promise.all([
    isCapabilityEnabled(CAPABILITY.NEWSLETTER),
    isRequestTenantActive(),
  ]);
  if (!isEnabled || !isActive) return null;

  const result = await service.modules.newsletter.v1.getNewsletter(
    id,
    sanityContext,
  );

  if (!result.ok) {
    logger.error(NEWSLETTER_LOG.MODULE_FETCH_FAILED, {
      id,
      error: result.error,
    });
    return null;
  }

  return <NewsletterModuleView id={id} {...result.data} />;
};

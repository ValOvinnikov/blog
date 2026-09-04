import { CAPABILITY } from '@blog/config';
import { service } from '@blog/service';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';

import { NewsletterModuleView } from './newsletter-module-view';

export interface INewsletterModuleProps {
  id: string;
  locale: string;
  tenant: string;
}

/**
 * NewsletterModule — fetches `module_newsletter` data and hands it to
 * `NewsletterModuleView`. This is the Blog index page's optional
 * page-builder placement (`page_blog.modules`) — editors opt in by adding
 * the module there, no hardcoded mount point. `sectionHeader.heading` is a
 * CMS-required field for this module (`requireHeading: true`), so it's
 * always a non-empty string here.
 *
 * Renders nothing when the tenant isn't entitled to (or hasn't enabled) the
 * `NEWSLETTER` capability — same silent-omission fallback `ModuleRenderer`
 * uses for an unrecognized module type.
 */
export const NewsletterModule = async ({
  id,
  tenant,
}: INewsletterModuleProps) => {
  const isEnabled = await isCapabilityEnabled(CAPABILITY.NEWSLETTER, tenant);
  if (!isEnabled) return null;

  const tenantContext = await getTenantSanityContext(tenant);
  const result = await service.modules.newsletter.v1.getNewsletter(
    id,
    tenantContext,
  );

  if (!result.ok) return null;

  return <NewsletterModuleView id={id} {...result.data} />;
};

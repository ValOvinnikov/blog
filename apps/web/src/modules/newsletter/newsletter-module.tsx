import { service } from '@blog/service';

import { NewsletterModuleView } from './newsletter-module-view';

export interface INewsletterModuleProps {
  id: string;
  locale: string;
}

/**
 * NewsletterModule — fetches `module_newsletter` data and hands it to
 * `NewsletterModuleView`. This is the Blog index page's optional
 * page-builder placement (`page_blog.modules`) — editors opt in by adding
 * the module there, no hardcoded mount point. `sectionHeader.heading` is a
 * CMS-required field for this module (`requireHeading: true`), so it's
 * always a non-empty string here.
 */
export async function NewsletterModule({ id }: INewsletterModuleProps) {
  const result = await service.modules.newsletter.v1.getNewsletter(id);

  if (!result.ok) return null;

  return <NewsletterModuleView id={id} {...result.data} />;
}

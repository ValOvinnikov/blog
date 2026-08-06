import { service } from '@blog/service';
import { NewsletterForm } from '@web/components/shared/newsletter-form';

import { newsletterModuleVariants } from './newsletter-module-variants';

export interface INewsletterModuleProps {
  id: string;
  locale: string;
}

const s = newsletterModuleVariants();

/**
 * NewsletterModule — fetches `module_newsletter` data and renders it through
 * the `NewsletterForm` client island (`full` density), the only place this
 * module's service and ui meet. This is the Blog index page's optional
 * page-builder placement (`page_blog.modules`) — editors opt in by adding
 * the module there, no hardcoded mount point (#1200). `heading`/`description`
 * are CMS-authored only (never an i18n fallback, per #1200) — an empty
 * `heading` renders an empty string rather than falling back to copy the
 * CMS field itself says is optional.
 */
export async function NewsletterModule({ id }: INewsletterModuleProps) {
  const result = await service.modules.newsletter.v1.getNewsletter(id);

  if (!result.ok) return null;

  const { heading, description } = result.data;

  return (
    <div className={s.root()}>
      <NewsletterForm
        variant="full"
        heading={heading ?? ''}
        description={description}
      />
    </div>
  );
}

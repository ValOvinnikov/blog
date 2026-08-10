import { service } from '@blog/service';
import { Section } from '@blog/ui/atoms';
import { NewsletterForm } from '@web/components/shared/newsletter-form';

import { newsletterModuleVariants } from './newsletter-module-variants';

export interface INewsletterModuleProps {
  id: string;
  locale: string;
}

const s = newsletterModuleVariants();

/**
 * NewsletterModule — fetches `module_newsletter` data and renders it through
 * the `NewsletterForm` client island (`full` density), wrapped in `Section`
 * for the CMS-authored `appearance` — the only place this module's service
 * and ui meet. This is the Blog index page's optional page-builder placement
 * (`page_blog.modules`) — editors opt in by adding the module there, no
 * hardcoded mount point (#1200). `heading`/`description` are CMS-authored
 * only (never an i18n fallback, per #1200); `heading` is a required CMS
 * field, so it's always a non-empty string here.
 */
export async function NewsletterModule({ id }: INewsletterModuleProps) {
  const result = await service.modules.newsletter.v1.getNewsletter(id);

  if (!result.ok) return null;

  const { heading, description, appearance } = result.data;

  return (
    <Section appearance={appearance} dataTestId={`newsletter-module-${id}`}>
      <div className={s.root()}>
        <NewsletterForm
          variant="full"
          heading={heading}
          description={description}
        />
      </div>
    </Section>
  );
}

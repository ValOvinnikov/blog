import { service } from '@blog/service';
import { NewsletterForm } from '@web/components/shared/newsletter-form';
import { Section } from '@web/components/shared/section';

export interface INewsletterModuleProps {
  id: string;
  locale: string;
}

/**
 * NewsletterModule — fetches `module_newsletter` data and renders it through
 * the `NewsletterForm` client island (`full` density) as `Section`'s direct
 * child, wrapped in `Section` (web's sole per-module landmark) for the
 * CMS-authored `brandVariant`/`appearance` — the only place this module's
 * service and ui meet. This is the Blog index page's optional page-builder
 * placement (`page_blog.modules`) — editors opt in by adding the module
 * there, no hardcoded mount point (#1200). `heading`/`description` are
 * CMS-authored only (never an i18n fallback, per #1200); `heading` is a
 * required CMS field, so it's always a non-empty string here.
 */
export async function NewsletterModule({ id }: INewsletterModuleProps) {
  const result = await service.modules.newsletter.v1.getNewsletter(id);

  if (!result.ok) return null;

  const { brandVariant, heading, description, appearance } = result.data;

  return (
    <Section
      brandVariant={brandVariant}
      appearance={appearance}
      titleId={`newsletter-${id}`}
      dataTestId={`newsletter-module-${id}`}
    >
      <NewsletterForm
        variant="full"
        heading={heading}
        description={description}
      />
    </Section>
  );
}

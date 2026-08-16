import { service } from '@blog/service';
import { NewsletterForm } from '@web/components/shared/newsletter-form';
import { Section } from '@web/components/shared/section';

export interface INewsletterModuleProps {
  id: string;
  locale: string;
}

/**
 * Fetches `module_newsletter` data and renders it through the
 * `NewsletterForm` client island (`full` density) as `Section`'s direct
 * child, wrapped in `Section` for the CMS-authored `brandVariant`/`layout`.
 * This is the Blog index page's optional page-builder placement
 * (`page_blog.modules`) — editors opt in by adding the module there, no
 * hardcoded mount point. `sectionHeader.heading` is a CMS-required field for
 * this module (`requireHeading: true`), so it's always a non-empty string
 * here.
 */
export async function NewsletterModule({ id }: INewsletterModuleProps) {
  const result = await service.modules.newsletter.v1.getNewsletter(id);

  if (!result.ok) return null;

  const { brandVariant, sectionHeader, layout } = result.data;
  const titleId = `newsletter-${id}`;

  return (
    <Section
      brandVariant={brandVariant}
      layout={layout}
      titleId={titleId}
      dataTestId={`newsletter-module-${id}`}
    >
      <NewsletterForm
        variant="full"
        heading={sectionHeader.heading}
        headingId={titleId}
        supportingText={sectionHeader.supportingText}
        align={sectionHeader.align}
      />
    </Section>
  );
}

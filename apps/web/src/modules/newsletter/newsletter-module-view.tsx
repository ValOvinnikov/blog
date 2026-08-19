import type { TNewsletterModule } from '@blog/service';
import { NewsletterForm } from '@web/components/shared/newsletter-form';
import { Section } from '@web/components/shared/section';

export interface INewsletterModuleViewProps extends TNewsletterModule {
  id: string;
}

/**
 * Pure view for `NewsletterModule` — the `Section` full-bleed landmark
 * wrapping the `NewsletterForm` client island (`full` density) as its direct
 * child, with no extra wrapping element in between.
 */
export function NewsletterModuleView({
  id,
  brandVariant,
  sectionHeader,
  layout,
}: INewsletterModuleViewProps) {
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

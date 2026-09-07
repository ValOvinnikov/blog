import type { TMaybeUndefined } from '@blog/config';
import type { TNewsletterModule } from '@blog/service';
import { NewsletterForm } from '@web/components/shared/newsletter-form';
import { Section } from '@web/components/shared/section';

export interface INewsletterModuleViewProps extends TNewsletterModule {
  id: string;
  trustCues: TMaybeUndefined<string[]>;
}

/**
 * Pure view for `NewsletterModule` — the `Section` full-bleed landmark
 * wrapping the `NewsletterForm` client island (`full` density) as its direct
 * child, with no extra wrapping element in between.
 */
export const NewsletterModuleView = ({
  id,
  brandVariant,
  sectionHeader,
  layout,
  contentAlignment,
  trustCues,
}: INewsletterModuleViewProps) => {
  const titleId = `newsletter-${id}`;
  const { heading, supportingText } = sectionHeader;

  return (
    <Section
      brandVariant={brandVariant}
      layout={layout}
      titleId={titleId}
      dataTestId={`newsletter-module-${id}`}
    >
      <NewsletterForm
        variant="full"
        heading={heading}
        headingId={titleId}
        supportingText={supportingText}
        trustCues={trustCues}
        align={contentAlignment}
      />
    </Section>
  );
};

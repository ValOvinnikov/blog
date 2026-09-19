import { NEWSLETTER_VARIANT, type TMaybeUndefined } from '@blog/config';
import type { TNewsletterModule } from '@blog/service';
import { NewsletterForm } from '@web/components/shared/newsletter-form';
import { Section } from '@web/components/shared/section';

export interface INewsletterModuleViewProps extends TNewsletterModule {
  id: string;
  trustCues: TMaybeUndefined<string[]>;
}

export const NewsletterModuleView = ({
  id,
  brandVariant,
  headingBlock,
  variant,
  layout,
  contentAlignment,
  trustCues,
}: INewsletterModuleViewProps) => {
  const titleId = `newsletter-${id}`;
  const { heading, supportingText } = headingBlock;
  const formVariant =
    variant === NEWSLETTER_VARIANT.COMPACT ? 'compact' : 'full';

  return (
    <Section
      brandVariant={brandVariant}
      layout={layout}
      titleId={titleId}
      dataTestId={`newsletter-module-${id}`}
    >
      <NewsletterForm
        variant={formVariant}
        heading={heading}
        headingId={titleId}
        supportingText={supportingText}
        trustCues={trustCues}
        align={contentAlignment}
      />
    </Section>
  );
};

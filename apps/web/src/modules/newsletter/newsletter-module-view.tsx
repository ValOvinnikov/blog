import { NEWSLETTER_VARIANT } from '@blog/config';
import type { TNewsletterModule } from '@blog/service';
import { ModuleHeading } from '@web/components/shared/module-heading';
import { NewsletterForm } from '@web/components/shared/newsletter-form';
import { NewsletterSubscribedGate } from '@web/components/shared/newsletter-subscribed-gate';
import { Section } from '@web/components/shared/section';
import { useId } from 'react';

export interface INewsletterModuleViewProps extends TNewsletterModule {
  id: string;
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
  const titleId = useId();
  const isCompact = variant === NEWSLETTER_VARIANT.COMPACT;

  return (
    <NewsletterSubscribedGate>
      <Section
        brandVariant={brandVariant}
        layout={layout}
        titleId={titleId}
        dataTestId={`newsletter-module-${id}`}
      >
        <ModuleHeading
          headingBlock={
            isCompact
              ? { ...headingBlock, supportingText: undefined }
              : headingBlock
          }
          id={titleId}
          level={2}
          align={contentAlignment}
          variant="section"
        />
        <NewsletterForm
          variant={isCompact ? 'compact' : 'full'}
          trustCues={trustCues}
          align={contentAlignment}
        />
      </Section>
    </NewsletterSubscribedGate>
  );
};

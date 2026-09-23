import { CONTENT_ALIGNMENT, DISPLAY_MODE } from '@blog/config';
import type { TTestimonialModule } from '@blog/service';
import { CardGrid } from '@blog/ui/organisms/card-grid';
import { ActionGroup } from '@web/components/shared/action-group';
import { ModuleHeading } from '@web/components/shared/module-heading';
import { Section } from '@web/components/shared/section';
import { toTestimonialGridColumns } from '@web/utils/to-testimonial-grid-columns';

import { TestimonialCard } from './testimonial-card';
import { TestimonialCarousel } from './testimonial-carousel';
import { testimonialModuleViewVariants } from './testimonial-module-view-variants';

export interface ITestimonialModuleViewProps extends TTestimonialModule {
  titleId: string;
  dataTestId: string;
}

export const TestimonialModuleView = ({
  brandVariant,
  headingBlock,
  testimonials,
  ctaButtons,
  displayMode,
  contentAlignment,
  cardAlignment,
  layout,
  titleId,
  dataTestId,
}: ITestimonialModuleViewProps) => {
  const [spotlightItem] = testimonials;
  if (!spotlightItem) return null;

  const isSpotlight = testimonials.length === 1;
  const headingAlign = isSpotlight
    ? CONTENT_ALIGNMENT.CENTER
    : contentAlignment;
  const cardAlign =
    cardAlignment === CONTENT_ALIGNMENT.CENTER ? 'center' : 'left';
  const columns = toTestimonialGridColumns(testimonials.length);
  const s = testimonialModuleViewVariants({ align: headingAlign });

  return (
    <Section
      brandVariant={brandVariant}
      layout={layout}
      titleId={titleId}
      dataTestId={dataTestId}
    >
      <ModuleHeading
        headingBlock={headingBlock}
        id={titleId}
        level={2}
        align={headingAlign}
        variant="section"
      />
      {isSpotlight ? (
        <TestimonialCard
          item={spotlightItem}
          align="center"
          tone={brandVariant}
          isSpotlight={true}
          dataTestId={`${dataTestId}-spotlight`}
        />
      ) : displayMode === DISPLAY_MODE.CAROUSEL ? (
        <TestimonialCarousel
          items={testimonials}
          align={cardAlign}
          tone={brandVariant}
          title={headingBlock.heading}
        />
      ) : (
        <CardGrid
          columns={columns}
          className={s.grid()}
          dataTestId={`${dataTestId}-grid`}
        >
          {testimonials.map((item) => (
            <TestimonialCard
              key={item.id}
              item={item}
              align={cardAlign}
              tone={brandVariant}
            />
          ))}
        </CardGrid>
      )}
      {ctaButtons.length > 0 && (
        <div className={s.actions()}>
          <ActionGroup actions={ctaButtons} />
        </div>
      )}
    </Section>
  );
};

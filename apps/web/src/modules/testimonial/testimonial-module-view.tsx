import { CONTENT_ALIGNMENT, DISPLAY_MODE } from '@blog/config';
import type { TTestimonialModule } from '@blog/service';
import { CardGrid } from '@blog/ui/components/organisms/card-grid';
import { hasLength } from '@blog/utils/primitives';
import { ActionGroup } from '@web/components/shared/action-group';
import { ModuleHeading } from '@web/components/shared/module-heading';
import { Section, type ISectionProps } from '@web/components/shared/section';
import { TestimonialCard } from '@web/modules/testimonial/components/testimonial-card/testimonial-card';
import { TestimonialCarousel } from '@web/modules/testimonial/components/testimonial-carousel/testimonial-carousel';
import { isLoneLastInRow } from '@web/utils/is-lone-last-in-row';
import { moduleGridActionsVariants } from '@web/utils/module-grid-actions-variants';
import { toCardGridColumns } from '@web/utils/to-card-grid-columns';
import { toTestimonialGridColumns } from '@web/utils/to-testimonial-grid-columns';

import { testimonialModuleViewVariants } from './testimonial-module-view-variants';

export interface ITestimonialModuleViewProps extends Pick<
  TTestimonialModule,
  | 'headingBlock'
  | 'testimonials'
  | 'ctaButtons'
  | 'displayMode'
  | 'contentAlignment'
  | 'cardAlignment'
  | 'columns'
> {
  section: Pick<ISectionProps, 'brandVariant' | 'layout' | 'appearance'>;
  titleId: string;
  dataTestId: string;
}

export const TestimonialModuleView = ({
  section,
  headingBlock,
  testimonials,
  ctaButtons,
  displayMode,
  contentAlignment,
  cardAlignment,
  columns: storedColumns,
  titleId,
  dataTestId,
}: ITestimonialModuleViewProps) => {
  const { brandVariant, layout, appearance } = section;
  const [spotlightItem] = testimonials;
  const isSpotlight = testimonials.length === 1;
  const carouselAlign =
    contentAlignment === CONTENT_ALIGNMENT.CENTER
      ? CONTENT_ALIGNMENT.CENTER
      : CONTENT_ALIGNMENT.LEFT;
  const cardAlign =
    cardAlignment === CONTENT_ALIGNMENT.CENTER ? 'center' : 'left';
  const columns =
    toCardGridColumns(storedColumns) ??
    toTestimonialGridColumns(testimonials.length);
  const s = moduleGridActionsVariants({ align: contentAlignment });
  const v = testimonialModuleViewVariants({ columns });
  const lastIndex = testimonials.length - 1;
  const isLoneBelowLg = isLoneLastInRow(testimonials.length, 2);
  const isLoneFromLg = isLoneLastInRow(testimonials.length, columns);

  return (
    <Section
      brandVariant={brandVariant}
      layout={layout}
      appearance={appearance}
      titleId={titleId}
      dataTestId={dataTestId}
    >
      <ModuleHeading
        headingBlock={headingBlock}
        id={titleId}
        level={2}
        align={contentAlignment}
        variant="section"
      />
      {isSpotlight && spotlightItem ? (
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
          contentAlignment={carouselAlign}
          title={headingBlock.heading}
        />
      ) : (
        <CardGrid
          columns={columns}
          className={v.grid()}
          dataTestId={`${dataTestId}-grid-${columns}`}
        >
          {testimonials.map((item, index) => (
            <TestimonialCard
              key={item.id}
              item={item}
              className={v.item({
                isLoneBelowLg: index === lastIndex && isLoneBelowLg,
                isLoneFromLg: index === lastIndex && isLoneFromLg,
              })}
              align={cardAlign}
              tone={brandVariant}
            />
          ))}
        </CardGrid>
      )}
      {hasLength(ctaButtons) && (
        <div className={s.actions()}>
          <ActionGroup actions={ctaButtons} />
        </div>
      )}
    </Section>
  );
};

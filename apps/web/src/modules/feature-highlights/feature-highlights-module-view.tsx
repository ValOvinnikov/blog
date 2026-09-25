import { MEDIA_ORDER } from '@blog/config';
import type { TFeatureHighlightsModule } from '@blog/service';
import { ActionGroup } from '@web/components/shared/action-group';
import { ModuleHeading } from '@web/components/shared/module-heading';
import { Section } from '@web/components/shared/section';
import { moduleGridActionsVariants } from '@web/utils/module-grid-actions-variants';

import {
  FeatureHighlightRow,
  type TFeatureHighlightMediaSide,
} from './components/feature-highlight-row/feature-highlight-row';
import { featureHighlightsModuleViewVariants } from './feature-highlights-module-view-variants';

const OPPOSITE_MEDIA_SIDE: Record<
  TFeatureHighlightMediaSide,
  TFeatureHighlightMediaSide
> = {
  start: 'end',
  end: 'start',
};

const toRowMediaSide = (
  baseSide: TFeatureHighlightMediaSide,
  index: number,
): TFeatureHighlightMediaSide =>
  index % 2 === 0 ? baseSide : OPPOSITE_MEDIA_SIDE[baseSide];

export interface IFeatureHighlightsModuleViewProps extends TFeatureHighlightsModule {
  titleId: string;
  dataTestId: string;
}

export const FeatureHighlightsModuleView = ({
  brandVariant,
  headingBlock,
  highlights,
  ctaButtons,
  mediaOrder,
  contentAlignment,
  layout,
  titleId,
  dataTestId,
}: IFeatureHighlightsModuleViewProps) => {
  if (highlights.length === 0) return null;

  const s = featureHighlightsModuleViewVariants();
  const actions = moduleGridActionsVariants({ align: contentAlignment });
  const baseSide: TFeatureHighlightMediaSide =
    mediaOrder === MEDIA_ORDER.FIRST ? 'start' : 'end';

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
        align={contentAlignment}
        variant="section"
      />
      <div className={s.rows()} data-testid={`${dataTestId}-rows`}>
        {highlights.map((item, index) => (
          <FeatureHighlightRow
            key={item.id}
            item={item}
            mediaSide={toRowMediaSide(baseSide, index)}
            dataTestId={`${dataTestId}-row-${item.id}`}
          />
        ))}
      </div>
      {ctaButtons.length > 0 && (
        <div className={actions.actions()}>
          <ActionGroup actions={ctaButtons} />
        </div>
      )}
    </Section>
  );
};

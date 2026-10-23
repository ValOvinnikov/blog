import { BRAND_VARIANT, MEDIA_ORDER, type TMediaOrder } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import {
  MOCK_FEATURE_HIGHLIGHTS_HEADING,
  mockFeatureHighlightItem,
} from '@web/testing/modules/feature-highlights/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { FeatureHighlightsModuleView } from './feature-highlights-module-view';

vi.mock('@web/i18n/navigation');

const highlights = [
  mockFeatureHighlightItem({ id: 'highlight-1' }),
  mockFeatureHighlightItem({ id: 'highlight-2' }),
  mockFeatureHighlightItem({ id: 'highlight-3' }),
  mockFeatureHighlightItem({ id: 'highlight-4' }),
];

const dataTestId = 'feature-highlights-module-feature-highlights-1';

const setup = customRender(FeatureHighlightsModuleView, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockHeadingBlock({ heading: MOCK_FEATURE_HIGHLIGHTS_HEADING }),
  highlights,
  ctaButtons: [],
  mediaOrder: MEDIA_ORDER.FIRST,
  contentAlignment: undefined,
  layout: undefined,
  titleId: 'feature-highlights-title',
  dataTestId,
});

describe(`<${FeatureHighlightsModuleView.name}/>`, () => {
  it.each([
    [MEDIA_ORDER.FIRST, ['start', 'end', 'start', 'end']],
    [MEDIA_ORDER.LAST, ['end', 'start', 'end', 'start']],
  ] as [TMediaOrder, string[]][])(
    'alternates each row side starting from media order %s',
    (mediaOrder, expectedSides) => {
      setup({ mediaOrder });

      highlights.forEach((highlight, index) => {
        const row = screen.getByTestId(`${dataTestId}-row-${highlight.id}`);
        expect(row).toHaveAttribute('data-media-side', expectedSides[index]);
      });
    },
  );
});

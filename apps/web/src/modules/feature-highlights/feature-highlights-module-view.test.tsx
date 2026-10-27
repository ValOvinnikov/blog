import { BRAND_VARIANT, MEDIA_ORDER, type TMediaOrder } from '@blog/config';
import { faker } from '@faker-js/faker';
import { customRender, screen } from '@web/testing/custom-render';
import {
  MOCK_FEATURE_HIGHLIGHTS_HEADING,
  mockFeatureHighlightItem,
} from '@web/testing/modules/feature-highlights/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { FeatureHighlightsModuleView } from './feature-highlights-module-view';

vi.mock('@web/i18n/navigation');

faker.seed(6011);

const MOCK_HIGHLIGHTS = Array.from({ length: 4 }, () =>
  mockFeatureHighlightItem({ id: faker.string.uuid() }),
);
const MOCK_DATA_TEST_ID = faker.string.uuid();
const MOCK_TITLE_ID = faker.string.uuid();

const setup = customRender(FeatureHighlightsModuleView, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockHeadingBlock({ heading: MOCK_FEATURE_HIGHLIGHTS_HEADING }),
  highlights: MOCK_HIGHLIGHTS,
  ctaButtons: [],
  mediaOrder: MEDIA_ORDER.FIRST,
  contentAlignment: undefined,
  layout: undefined,
  titleId: MOCK_TITLE_ID,
  dataTestId: MOCK_DATA_TEST_ID,
});

describe(`<${FeatureHighlightsModuleView.name}/>`, () => {
  it.each([
    [MEDIA_ORDER.FIRST, ['start', 'end', 'start', 'end']],
    [MEDIA_ORDER.LAST, ['end', 'start', 'end', 'start']],
  ] as [TMediaOrder, string[]][])(
    'alternates each row side starting from media order %s',
    (mediaOrder, expectedSides) => {
      setup({ mediaOrder });

      MOCK_HIGHLIGHTS.forEach((highlight, index) => {
        const row = screen.getByTestId(
          `${MOCK_DATA_TEST_ID}-row-${highlight.id}`,
        );
        expect(row).toHaveAttribute('data-media-side', expectedSides[index]);
      });
    },
  );
});

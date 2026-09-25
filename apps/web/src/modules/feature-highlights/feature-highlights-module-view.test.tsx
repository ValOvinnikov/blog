import { BRAND_VARIANT, MEDIA_ORDER, type TMediaOrder } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import { ctaActionsDemo } from '@web/testing/modules/cta/fixtures';
import { makeFeatureHighlightItem } from '@web/testing/modules/feature-highlights/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { SmartLinkMock } from '@web/testing/shared/smart-link/smart-link-mock';

import { FeatureHighlightsModuleView } from './feature-highlights-module-view';

vi.mock('@web/components/shared/smart-link', () => ({
  SmartLink: SmartLinkMock,
}));

const highlights = [
  makeFeatureHighlightItem({ id: 'highlight-1' }),
  makeFeatureHighlightItem({ id: 'highlight-2' }),
  makeFeatureHighlightItem({ id: 'highlight-3' }),
  makeFeatureHighlightItem({ id: 'highlight-4' }),
];

const dataTestId = 'feature-highlights-module-feature-highlights-1';

const setup = customRender(FeatureHighlightsModuleView, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: makeHeadingBlock({ heading: 'Why choose us' }),
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
    'alternates each row side starting from mediaOrder %s',
    (mediaOrder, expectedSides) => {
      setup({ mediaOrder });

      highlights.forEach((highlight, index) => {
        expect(
          screen.getByTestId(`${dataTestId}-row-${highlight.id}`),
        ).toHaveAttribute('data-media-side', expectedSides[index]);
      });
    },
  );

  it('renders a row action only when the row has one', () => {
    setup({
      highlights: [
        makeFeatureHighlightItem({ id: 'highlight-1', action: undefined }),
        makeFeatureHighlightItem({
          id: 'highlight-2',
          action: ctaActionsDemo[0],
        }),
      ],
    });

    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(
      screen.getByRole('link', { name: ctaActionsDemo[0]!.link.label }),
    ).toBeInTheDocument();
  });
});

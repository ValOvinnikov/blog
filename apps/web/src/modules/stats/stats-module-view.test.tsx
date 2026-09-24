import { BRAND_VARIANT } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import { ctaActionsDemo } from '@web/testing/modules/cta/fixtures';
import { makeStatItem } from '@web/testing/modules/stats/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { SmartLinkMock } from '@web/testing/shared/smart-link/smart-link-mock';
import { toModuleGridColumns } from '@web/utils/to-module-grid-columns';

import { StatsModuleView } from './stats-module-view';

vi.mock('@web/components/shared/smart-link', () => ({
  SmartLink: SmartLinkMock,
}));

const dataTestId = 'stats-module-stats-1';

const setup = customRender(StatsModuleView, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: makeHeadingBlock({ heading: 'By the numbers' }),
  stats: [
    makeStatItem({ id: 'stat-1', label: 'Monthly readers' }),
    makeStatItem({ id: 'stat-2', label: 'Median TTFB' }),
  ],
  footnote: undefined,
  ctaButtons: [],
  contentAlignment: undefined,
  layout: undefined,
  titleId: 'stats-title',
  dataTestId,
});

describe(`<${StatsModuleView.name}/>`, () => {
  it.each([2, 4, 5, 6])(
    'derives its column count from toModuleGridColumns for %i figures',
    (statCount) => {
      const stats = Array.from({ length: statCount }, (_, index) =>
        makeStatItem({ id: `stat-${index}`, label: `Metric ${index}` }),
      );

      setup({ stats });

      expect(screen.getByTestId(`${dataTestId}-grid`)).toHaveAttribute(
        'data-columns',
        String(toModuleGridColumns(statCount)),
      );
    },
  );

  it('renders the given labels and values', () => {
    setup();

    expect(screen.getByText('Monthly readers')).toBeVisible();
    expect(screen.getByText('Median TTFB')).toBeVisible();
  });

  it('renders no footnote when unset', () => {
    setup();

    expect(screen.queryByText(/figures reflect/i)).not.toBeInTheDocument();
  });

  it('renders the footnote when set', () => {
    setup({ footnote: 'Figures reflect the trailing 12 months.' });

    expect(
      screen.getByText('Figures reflect the trailing 12 months.'),
    ).toBeVisible();
  });

  it('renders no action group when there are no cta buttons', () => {
    setup();

    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });

  it('renders the resolved cta buttons when present', () => {
    setup({ ctaButtons: ctaActionsDemo });

    expect(screen.getByRole('link', { name: 'Subscribe now' })).toHaveAttribute(
      'href',
      '/blog',
    );
  });
});

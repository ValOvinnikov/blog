import { BRAND_VARIANT } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import {
  MOCK_CTA_PRIMARY_ACTION,
  MOCK_CTA_ACTIONS,
} from '@web/testing/modules/cta/fixtures';
import { MOCK_STAT_ITEMS } from '@web/testing/modules/stats/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { StatsModuleView } from './stats-module-view';

vi.mock('@web/i18n/navigation');

const FOOTNOTE = 'Figures reflect the trailing 12 months.';

const dataTestId = 'stats-module-stats-1';

const setup = customRender(StatsModuleView, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockHeadingBlock({ heading: 'By the numbers' }),
  stats: MOCK_STAT_ITEMS,
  footnote: undefined,
  ctaButtons: [],
  contentAlignment: undefined,
  layout: undefined,
  titleId: 'stats-title',
  dataTestId,
});

describe(`<${StatsModuleView.name}/>`, () => {
  describe('with default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders the given labels and values', () => {
      MOCK_STAT_ITEMS.forEach(({ label }) => {
        const statLabel = screen.getByText(label);
        expect(statLabel).toBeVisible();
      });
    });

    it('renders no footnote when unset', () => {
      const footnote = screen.queryByText(FOOTNOTE);
      expect(footnote).not.toBeInTheDocument();
    });

    it('renders no action group when there are no cta buttons', () => {
      const links = screen.queryAllByRole('link');
      expect(links).toHaveLength(0);
    });
  });

  it('renders the footnote when set', () => {
    setup({ footnote: FOOTNOTE });

    const footnote = screen.getByText(FOOTNOTE);
    expect(footnote).toBeVisible();
  });

  it('renders the resolved cta buttons when present', () => {
    setup({ ctaButtons: MOCK_CTA_ACTIONS });

    const action = screen.getByRole('link', {
      name: MOCK_CTA_PRIMARY_ACTION.link.label,
    });
    expect(action).toHaveAttribute('href', MOCK_CTA_PRIMARY_ACTION.link.href);
  });
});

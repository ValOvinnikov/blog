import { faker } from '@faker-js/faker';
import { customRender, screen } from '@web/testing/custom-render';
import {
  MOCK_CTA_ACTIONS,
  MOCK_CTA_PRIMARY_ACTION,
} from '@web/testing/modules/cta/fixtures';
import {
  MOCK_STAT_ITEMS,
  mockStatsModule,
} from '@web/testing/modules/stats/fixtures';

import { StatsModuleView } from './stats-module-view';

vi.mock('@web/i18n/navigation');

faker.seed(31);

const MOCK_FOOTNOTE = faker.lorem.sentence();
const MOCK_TITLE_ID = faker.string.uuid();
const MOCK_DATA_TEST_ID = faker.string.uuid();

const setup = customRender(StatsModuleView, {
  ...mockStatsModule(),
  titleId: MOCK_TITLE_ID,
  dataTestId: MOCK_DATA_TEST_ID,
});

describe(`<${StatsModuleView.name}/>`, () => {
  describe('with default props', () => {
    beforeEach(() => {
      setup();
    });

    it.each(MOCK_STAT_ITEMS.map(({ label }) => label))(
      'renders the stat labelled %s',
      (label) => {
        const statLabel = screen.getByText(label);

        expect(statLabel).toBeVisible();
      },
    );

    it.each(MOCK_STAT_ITEMS.map(({ value }) => value))(
      'renders the stat value %s',
      (value) => {
        const statValue = screen.getByText(value);

        expect(statValue).toBeVisible();
      },
    );

    it('renders no footnote when unset', () => {
      const footnote = screen.queryByText(MOCK_FOOTNOTE);

      expect(footnote).not.toBeInTheDocument();
    });

    it('renders no action group when there are no cta buttons', () => {
      const links = screen.queryAllByRole('link');

      expect(links).toHaveLength(0);
    });
  });

  it('renders the footnote when set', () => {
    setup({ footnote: MOCK_FOOTNOTE });

    const footnote = screen.getByText(MOCK_FOOTNOTE);

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
